import { CSP } from './csp-generated';

export interface Env {
  CONTACT_FROM?: string;
  CONTACT_TO?: string;
  CONTACT_KV: KVNamespace;
  SUBSCRIBERS_KV: KVNamespace;
  NOTIFY: SendEmail;
  ASSETS: Fetcher;
}

interface Payload {
  name?: string;
  email?: string;
  message?: string;
  website?: string; // honeypot
}

interface SubscribePayload {
  email?: string;
  name?: string;
  source?: string;
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

    if (url.pathname === '/api/subscribe') {
      if (request.method !== 'POST') {
        return json({ ok: false, error: 'method_not_allowed' }, 405);
      }

      let body: SubscribePayload;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: 'invalid_json' }, 400);
      }

      const email = (body.email ?? '').trim().toLowerCase();
      const name = (body.name ?? '').trim();
      const source = (body.source ?? 'brief').trim();

      // Honeypot: same discipline as the contact form.
      if ((body.website ?? '') !== '') return json({ ok: true });

      if (!email) return json({ ok: false, error: 'email_required' }, 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'email_invalid' }, 400);
      if (name && name.length > 100) return json({ ok: false, error: 'name_too_long' }, 400);

      const timestamp = new Date().toISOString();

      // Confirmation token reserved for the double opt-in leg (Email
      // Sending binding, once graduated). Generated now so later
      // activation needs no data migration.
      const confirmToken = `${Date.now()}_${Math.random().toString(36).slice(2, 16)}`;

      // NOTE: subscriber records carry NO expirationTtl. Unlike contact
      // submissions, these must persist indefinitely.
      try {
        const existing = await env.SUBSCRIBERS_KV.get(email);
        if (existing) {
          const existingData = JSON.parse(existing);
          // Idempotent: a confirmed subscriber is not re-written and not
          // demoted by a repeat signup.
          if (existingData.status === 'subscribed') {
            return json({ ok: true, already_subscribed: true });
          }
          if (existingData.status === 'pending') {
            await env.SUBSCRIBERS_KV.put(email, JSON.stringify({
              ...existingData,
              source,
              confirm_token: confirmToken,
              resubmitted_at: timestamp,
            }));
            return json({ ok: true, already_pending: true });
          }
          if (existingData.status === 'unsubscribed') {
            // Resubscription after unsubscribe: reopen as pending, keep history.
            await env.SUBSCRIBERS_KV.put(email, JSON.stringify({
              ...existingData,
              status: 'pending',
              confirm_token: confirmToken,
              source,
              resubscribed_at: timestamp,
            }));
            return json({ ok: true, resubscribed: true });
          }
        }
      } catch (err) {
        console.error('Subscriber lookup failed:', err);
        // Non-fatal: continue with fresh insert.
      }

      // Durable record FIRST. No notification leg: per-signup emails are
      // operator noise by design; KV is the subscriber source of truth
      // and is checked directly before each send.
      try {
        await env.SUBSCRIBERS_KV.put(email, JSON.stringify({
          email,
          name: name || null,
          source,
          status: 'pending', // TODO: flip to 'subscribed' on confirmation once double opt-in leg ships
          confirm_token: confirmToken,
          timestamp,
        }));
      } catch (err) {
        console.error('KV write failed:', err);
        return json({ ok: false, error: 'internal_error' }, 500);
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
// 2026-09-22: Added /api/subscribe endpoint (SUBSCRIBERS_KV, no TTL, no notify).
