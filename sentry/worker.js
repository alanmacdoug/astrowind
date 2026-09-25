// Sender Sentry: Inbound Email Worker (skeleton phase, corrected v3)
// Receives mail via Email Routing catch-all on macdougallemail.com.
// Validates recipient, persists stub row to D1. No XML parsing yet.

const EXPECTED_DOMAIN = "reports.macdougallemail.com";
const TOKEN_PATTERN = /^dmarc-([a-z0-9]{3,12})$/i;

export default {
  async email(message, env, ctx) {
    // DIAGNOSTIC: log the true shape and value of message.to.
    console.log("INBOUND typeof to=[" + typeof message.to + "] value=[" + String(message.to) + "]");

    // Accept string, object with .address, or array of either.
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

    // Gate 1: recipient must be on the reports subdomain, exactly.
    if (domain !== EXPECTED_DOMAIN) {
      console.log("REJECT gate1: domain=[" + domain + "]");
      message.setReject("Recipient rejected: invalid address");
      return;
    }

    // Gate 2: local-part must carry the dmarc-XXXX token pattern.
    const match = localPart.match(TOKEN_PATTERN);
    if (!match) {
      console.log("REJECT gate2: localPart=[" + localPart + "]");
      message.setReject("Recipient rejected: invalid address");
      return;
    }
    const customerToken = match[1];

    // Gate 3: token must belong to an active customer.
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

    // Sender address: string property per Cloudflare EmailMessage docs.
    const senderAddress = (typeof message.from === "string" ? message.from : "").toLowerCase();

    // All gates passed: persist the stub row.
    try {
      await env.DB.prepare(
        `INSERT INTO reports_raw
           (customer_token, recipient_email, sender_address, subject,
            received_at, message_id, attachment_count,
            attachment_total_size_bytes, processing_status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, 0, 'pending')`
      )
        .bind(
          customerToken,
          toAddress,
          senderAddress,
          message.headers?.get("subject") ?? null,
          Math.floor(Date.now() / 1000),
          message.headers?.get("message-id") ?? null
        )
        .run();
      console.log("INSERT OK: token=[" + customerToken + "]");
    } catch (err) {
      console.error("Stub insert failed:", err);
      message.setReject("Temporary failure, please retry");
      return;
    }

    // Skeleton phase: the mail is accepted and its body discarded.
  },
};
