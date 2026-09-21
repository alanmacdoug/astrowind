import { CSP } from './csp-generated';

export interface Env {
  CONTACT_FROM?: string;
  CONTACT_TO?: string;
  CONTACT_KV: KVNamespace;
  NOTIFY: SendEmail;
  ASSETS: Fetcher;
}

interface Payload {
  name?: string;
  email?: string;
  message?: string;
  website?: string; // honeypot
}

const NOTIFY_ADDRESS = 'amacmack@proton.me'; // verified Email Routing destination

const json = (data: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') {
        return json({ ok: false, error: 'method_not_allowed' }, 405);
      }

      let body: Payload;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: 'invalid_json' }, 400);
      }

      const name = (body.name ?? '').trim();
      const email = (body.email ?? '').trim();
      const message = (body.message ?? '').trim();

      // Honeypot: humans never see this field. Silently accept and discard.
      if ((body.website ?? '') !== '') return json({ ok: true });

      if (!name || name.length > 200) return json({ ok: false, error: 'name' }, 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'email' }, 400);
      if (!message || message.length > 5000) return json({ ok: false, error: 'message' }, 400);

      const timestamp = new Date().toISOString();
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const referrer = request.headers.get('Referer') || 'direct';

      // Durable record FIRST — the submission is never lost even if the
      // notification leg fails. 90-day retention keeps KV bounded.
      try {
        const kvId = `submission_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await env.CONTACT_KV.put(kvId, JSON.stringify({
          name, email, message, timestamp, ip, referrer,
        }), { expirationTtl: 60 * 60 * 24 * 90 });
      } catch (err) {
        console.error('KV write failed:', err);
      }

      // Notification via Cloudflare Email Routing send_email binding.
      // No API key, no third party — the destination is the verified
      // Email Routing address. NOTE: the send_email binding supports
      // plain text only and does not support reply-to, so the sender's
      // address is included in the body for copy-paste replies.
      const fromAddress = env.CONTACT_FROM || 'help@macdougallemail.com';
      let notified = false;
      try {
        await env.NOTIFY.send({
          from: fromAddress,
          to: NOTIFY_ADDRESS,
          subject: `Website enquiry from ${name}`,
          text: `From: ${name} <${email}>\n\n${message}\n\n---\nReceived: ${timestamp}\nIP: ${ip}\nPage: ${referrer}`,
        });
        notified = true;
      } catch (err) {
        console.error('Email notification failed:', err);
      }

      // The submission is durable in KV even if notification failed, so
      // the visitor gets a success response either way. Losing a lead to a
      // transient email failure is not acceptable; KV is the backstop.
      if (!notified) {
        console.warn('Contact submission stored to KV only — check the namespace.');
      }
      return json({ ok: true });
    }

    // Everything else: serve the static asset, stamp the CSP header on top.
    // The CSP is assembled at build time (worker/csp-generated.ts) because the
    // inline-script hash list exceeds the 2000-character _headers line limit.
    const assetResponse = await env.ASSETS.fetch(request);
    const headers = new Headers(assetResponse.headers);
    headers.set('Content-Security-Policy', CSP);
    return new Response(assetResponse.status === 204 ? null : assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    });
  },
};
// ─── CSP hash auto-generation trigger ───
// Build-time script creates ./csp-generated.ts with 68 hashes.
// Comment change forces re-deploy to validate the import chain.
// Last checked: 2026-09-21 15:40 UTC
// 2026-09-21: SendGrid leg replaced by NOTIFY send_email binding (routing active).
