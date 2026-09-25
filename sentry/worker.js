// Sender Sentry: Inbound Email Worker (skeleton phase)
// Receives mail via Email Routing catch-all on macdougallemail.com.
// Validates recipient, persists stub row to D1. No XML parsing yet.

const EXPECTED_DOMAIN = "reports.macdougallemail.com";
const TOKEN_PATTERN = /^dmarc-([a-z0-9]{3,12})$/i;

export default {
  async email(message, env, ctx) {
    // message.to is an object; .address holds the full recipient string.
    const toAddress = (message.to?.address ?? "").toLowerCase();
    const atIndex = toAddress.indexOf("@");
    if (atIndex === -1) {
      message.setReject("Recipient rejected: invalid address");
      return;
    }
    const localPart = toAddress.slice(0, atIndex);
    const domain = toAddress.slice(atIndex + 1);

    // Gate 1: recipient must be on the reports subdomain, exactly.
    // Apex strays (typos like held@macdougallemail.com) die here.
    if (domain !== EXPECTED_DOMAIN) {
      message.setReject("Recipient rejected: invalid address");
      return;
    }

    // Gate 2: local-part must carry the dmarc-XXXX token pattern.
    const match = localPart.match(TOKEN_PATTERN);
    if (!match) {
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
      // Database unreachable: reject with retry semantics rather than
      // silently dropping a report the sender will not resend.
      console.error("Customer lookup failed:", err);
      message.setReject("Temporary failure, please retry");
      return;
    }
    if (!customer) {
      message.setReject("Recipient rejected: unknown token");
      return;
    }

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
          (message.from ?? "").toLowerCase(),
          message.headers.get("subject"),
          Math.floor(Date.now() / 1000),
          message.headers.get("message-id")
        )
        .run();
    } catch (err) {
      console.error("Stub insert failed:", err);
      message.setReject("Temporary failure, please retry");
      return;
    }

    // Skeleton phase: the mail is accepted and its body discarded.
    // Attachment capture and XML parsing are Saturday's work.
  },
};
