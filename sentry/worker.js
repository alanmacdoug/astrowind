// Sender Sentry: Inbound Email Worker (parser phase, v5)
// Pipeline: receive -> validate gates -> store raw -> parse MIME ->
//           gunzip/extract XML -> aggregate -> update status.
import PostalMime from "postal-mime";

const EXPECTED_DOMAIN = "reports.macdougallemail.com";
const TOKEN_PATTERN = /^dmarc-([a-z0-9]{3,12})$/i;
const MAX_RAW_BYTES = 1048576; // 1 MiB storage cap per message

// ---------- utility helpers ----------

function toBase64(bytes) {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function fromBase64(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function gunzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// ---------- XML helpers (regex-based, per v1 scope) ----------

function section(xml, name) {
  const m = xml.match(new RegExp("<" + name + ">([\\s\\S]*?)</" + name + ">"));
  return m ? m[1] : null;
}

function tag(block, name) {
  if (!block) return null;
  const m = block.match(new RegExp("<" + name + "\\s*>([\\s\\S]*?)</" + name + ">"));
  return m ? m[1].trim() : null;
}

// ---------- spoofing verification (v1: log only) ----------

function spoofCheck(orgName, senderAddress) {
  if (!senderAddress || senderAddress.indexOf("@") === -1) {
    return "spoof-warn: no usable sender address";
  }
  const sdomain = senderAddress.split("@")[1].toLowerCase();
  const sld = sdomain.split(".").filter(Boolean).slice(-2)[0];
  const org = (orgName || "").toLowerCase();
  if (sld && org.indexOf(sld) !== -1) return null;
  return "spoof-warn: org=[" + (orgName || "?") + "] sender-domain=[" + sdomain + "]";
}

// ---------- core parser ----------

async function processMessage(env, reportId, customerToken, senderAddress, rawBytes) {
  const mime = await PostalMime.parse(rawBytes);
  const attachments = mime.attachments || [];

  let gzAtt = null, xmlAtt = null, hasZip = false;
  for (const att of attachments) {
    const name = (att.filename || "").toLowerCase();
    const mt = (att.mimeType || "").toLowerCase();
    if (name.endsWith(".gz") || mt === "application/gzip") gzAtt = att;
    else if (name.endsWith(".xml") || mt.includes("xml")) xmlAtt = att;
    else if (name.endsWith(".zip") || mt === "application/zip") hasZip = true;
  }

  if (!gzAtt && !xmlAtt) {
    if (hasZip) {
      return { status: "skipped", note: "zip attachments not supported in v1; manual review required" };
    }
    return { status: "failed", note: "no report attachment found (" + attachments.length + " attachments)" };
  }

  let xmlText;
  try {
    const bytes = gzAtt ? await gunzip(gzAtt.content) : xmlAtt.content;
    xmlText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch (err) {
    return { status: "failed", note: "decompression failed: " + (err && err.message ? err.message : String(err)) };
  }

  // report metadata
  const metaBlock = section(xmlText, "report_metadata");
  const orgName = tag(metaBlock, "org_name");
  const dateBlock = section(xmlText, "date_range");
  const beginStr = tag(dateBlock, "begin");
  const policyBlock = section(xmlText, "policy_published");
  const reportedDomain = tag(policyBlock, "domain");

  if (!orgName || !reportedDomain) {
    return { status: "failed", note: "XML structure invalid: missing report_metadata or policy_published" };
  }

  const records = xmlText.match(/<record>[\s\S]*?<\/record>/g) || [];
  if (records.length === 0) {
    return { status: "failed", note: "XML structure invalid: zero <record> elements" };
  }

  let total = 0, dkimPass = 0, dkimFail = 0, spfPass = 0, spfFail = 0,
      dmarcPass = 0, dmarcFail = 0, unparsedRecords = 0;

  for (const rec of records) {
    const rowBlock = section(rec, "row");
    const peBlock = section(rec, "policy_evaluated");
    const count = parseInt(tag(rowBlock, "count") || "", 10);
    const dkimRes = (tag(peBlock, "dkim") || "").toLowerCase();
    const spfRes = (tag(peBlock, "spf") || "").toLowerCase();

    if (!Number.isFinite(count)) { unparsedRecords++; continue; }
    total += count;
    if (dkimRes === "pass") dkimPass += count; else dkimFail += count;
    if (spfRes === "pass") spfPass += count; else spfFail += count;
    if (dkimRes === "pass" && spfRes === "pass") dmarcPass += count; else dmarcFail += count;
  }

  // totals reconciliation: buckets must partition total exactly
  const reconciles =
    dkimPass + dkimFail === total &&
    spfPass + spfFail === total &&
    dmarcPass + dmarcFail === total;
  let note = null;
  if (unparsedRecords > 0 || !reconciles) {
    note = "reconciliation warning: unparsedRecords=" + unparsedRecords +
      " total=" + total + " bucketsDkim=" + (dkimPass + dkimFail) +
      " bucketsSpf=" + (spfPass + spfFail);
  }

  const spoofNote = spoofCheck(orgName, senderAddress);
  if (spoofNote) note = note ? note + "; " + spoofNote : spoofNote;

  const reportDate = Number.isFinite(parseInt(beginStr || "", 10))
    ? new Date(parseInt(beginStr, 10) * 1000).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  await env.DB.prepare(
    `INSERT INTO aggregates_daily
       (report_id, customer_token, domain, report_date, received_at,
        total_messages, dkim_pass, dkim_fail, spf_pass, spf_fail,
        dmarc_pass, dmarc_fail, reporter_org)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`
  )
    .bind(
      reportId, customerToken, reportedDomain, reportDate, Math.floor(Date.now() / 1000),
      total, dkimPass, dkimFail, spfPass, spfFail, dmarcPass, dmarcFail, orgName
    )
    .run();

  return {
    status: "parsed",
    note,
    stats: { records: records.length, total, dkimPass, dkimFail, spfPass, spfFail, dmarcPass, dmarcFail, org: orgName },
  };
}

async function updateStatus(env, reportId, result) {
  await env.DB.prepare(
    "UPDATE reports_raw SET processing_status = ?1, parsed_at = strftime('%s','now'), error_note = ?2 WHERE id = ?3"
  )
    .bind(result.status, result.note || null, reportId)
    .run();
}

// ---------- worker ----------

export default {
  async email(message, env, ctx) {
    // Shape-tolerant recipient parsing (string, object, or array).
    let toAddress = "";
    if (typeof message.to === "string") {
      toAddress = message.to;
    } else if (Array.isArray(message.to)) {
      const first = message.to[0];
      toAddress = typeof first === "string" ? first : (first?.address ?? "");
    } else if (message.to && typeof message.to === "object") {
      toAddress = message.to.address ?? "";
    }
    toAddress = toAddress.toString().toLowerCase().trim();

    const atIndex = toAddress.indexOf("@");
    if (atIndex === -1) {
      console.log("REJECT gate0: parsed=[" + toAddress + "]");
      message.setReject("Recipient rejected: invalid address");
      return;
    }
    const localPart = toAddress.slice(0, atIndex);
    const domain = toAddress.slice(atIndex + 1);

    if (domain !== EXPECTED_DOMAIN) {
      console.log("REJECT gate1: domain=[" + domain + "]");
      message.setReject("Recipient rejected: invalid address");
      return;
    }

    const match = localPart.match(TOKEN_PATTERN);
    if (!match) {
      console.log("REJECT gate2: localPart=[" + localPart + "]");
      message.setReject("Recipient rejected: invalid address");
      return;
    }
    const customerToken = match[1];

    let customer = null;
    try {
      customer = await env.DB.prepare(
        "SELECT id, customer_token FROM customers WHERE customer_token = ?1 AND active = 1"
      )
        .bind(customerToken)
        .first();
    } catch (err) {
      console.error("Customer lookup failed:", err);
      message.setReject("Temporary failure, please retry");
      return;
    }
    if (!customer) {
      console.log("REJECT gate3: token=[" + customerToken + "] not found or inactive");
      message.setReject("Recipient rejected: unknown token");
      return;
    }

    const senderAddress = (typeof message.from === "string" ? message.from : "").toLowerCase();

    // Gates passed: read the full raw RFC 5322 message before it is discarded.
    let rawBytes = null;
    let payloadB64 = null;
    let rawHash = null;
    let attachCount = 0;
    let errorNote = null;
    try {
      if (message.raw != null) {
        rawBytes = new Uint8Array(await new Response(message.raw).arrayBuffer());
        if (rawBytes.length > 0 && rawBytes.length <= MAX_RAW_BYTES) {
          payloadB64 = toBase64(rawBytes);
          rawHash = await sha256Hex(rawBytes);
          attachCount = (new TextDecoder("utf-8", { fatal: false }).decode(rawBytes)
            .match(/content-disposition:\s*attachment/gi) || []).length;
        } else if (rawBytes.length > MAX_RAW_BYTES) {
          errorNote = "payload exceeded " + MAX_RAW_BYTES + " byte cap; not stored";
          console.warn("OVERSIZE: token=[" + customerToken + "] bytes=[" + rawBytes.length + "]");
        }
      } else {
        errorNote = "message.raw unavailable; payload not stored";
      }
    } catch (err) {
      console.error("Raw read failed:", err);
      message.setReject("Temporary failure, please retry");
      return;
    }

    // Duplicate suppression on content hash.
    let dupId = null;
    if (rawHash) {
      try {
        const dup = await env.DB.prepare(
          "SELECT id FROM reports_raw WHERE raw_content_hash = ?1 AND id != last_insert_rowid() LIMIT 1"
        ).bind(rawHash).first();
        dupId = dup ? dup.id : null;
      } catch (err) {
        console.warn("Dup check failed (continuing):", err);
      }
    }

    let reportId = null;
    try {
      const result = await env.DB.prepare(
        `INSERT INTO reports_raw
           (customer_token, recipient_email, sender_address, subject,
            received_at, message_id, attachment_count,
            attachment_total_size_bytes, raw_content_hash, raw_payload,
            processing_status, error_note)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, NULL, ?8, ?9, ?10, ?11)`
      )
        .bind(
          customerToken,
          toAddress,
          senderAddress,
          message.headers?.get("subject") ?? null,
          Math.floor(Date.now() / 1000),
          message.headers?.get("message-id") ?? null,
          attachCount,
          rawHash,
          payloadB64,
          dupId ? "duplicate" : "pending",
          dupId ? "duplicate of report id " + dupId : errorNote
        )
        .run();
      reportId = result.meta?.last_row_id ?? null;
      console.log("INSERT OK: token=[" + customerToken + "] id=[" + reportId + "] dup=[" + (dupId || "no") + "]");
    } catch (err) {
      console.error("Insert failed:", err);
      message.setReject("Temporary failure, please retry");
      return;
    }

    // Duplicate or metadata-only row: nothing to parse.
    if (dupId || !payloadB64 || !reportId) return;

    // Parse on arrival.
    try {
      const outcome = await processMessage(env, reportId, customerToken, senderAddress, rawBytes);
      await updateStatus(env, reportId, outcome);
      console.log("PARSE " + outcome.status + ": id=[" + reportId + "] " +
        (outcome.stats ? JSON.stringify(outcome.stats) : (outcome.note || "")));
    } catch (err) {
      console.error("Parser failed:", err);
      try {
        await updateStatus(env, reportId, {
          status: "failed",
          note: "parser exception: " + (err && err.message ? err.message : String(err)),
        });
      } catch (_) { /* swallow: row stays pending */ }
    }
  },

  // Reprocess endpoint: GET /reprocess?id=N with Authorization: Bearer <ADMIN_TOKEN>
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/reprocess") {
      return new Response("Not found", { status: 404 });
    }
    const auth = request.headers.get("Authorization") || "";
    if (!env.ADMIN_TOKEN || auth !== "Bearer " + env.ADMIN_TOKEN) {
      return new Response("Unauthorized", { status: 401 });
    }
    const id = parseInt(url.searchParams.get("id") || "", 10);
    if (!Number.isFinite(id)) {
      return Response.json({ error: "id query parameter required" }, { status: 400 });
    }
    const row = await env.DB.prepare(
      "SELECT id, customer_token, sender_address, raw_payload FROM reports_raw WHERE id = ?1"
    ).bind(id).first();
    if (!row || !row.raw_payload) {
      return Response.json({ error: "row not found or no stored payload" }, { status: 404 });
    }
    const bytes = fromBase64(row.raw_payload);
    const outcome = await processMessage(env, row.id, row.customer_token, row.sender_address, bytes);
    await updateStatus(env, row.id, outcome);
    return Response.json(outcome);
  },
};
