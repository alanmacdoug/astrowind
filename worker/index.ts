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
  email: string;
  name?: string;
  source?: string; // page path or campaign identifier
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

      // Honeypot field: must be absent or empty
      if ((body.website ?? '') !== '') return json({ ok: true });

      if (!email) return json({ ok: false, error: 'email_required' }, 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'email_invalid' }, 400);
      if (name && name.length > 100) return json({ ok: false, error: 'name_too_long' }, 400);

      const timestamp = new Date().toISOString();
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const referrer = request.headers.get('Referer') || 'direct';

      // Generate confirmation token for future double opt-in (currently unused)
      const confirmToken = `${Date.now()}_${Math.random().toString(36).slice(2, 16)}`;

      // Check for existing subscriber with this email
      try {
        const existing = await env.SUBSCRIBERS_KV.get(email);
        if (existing) {
          const existingData = JSON.parse(existing);
          // Already subscribed? Return success without creating duplicate
          if (existingData.status === 'subscribed') {
            return json({ ok: true, already_subscribed: true });
          }
          // Pending subscription? Update timestamp and return success
          if (existingData.status === 'pending') {
            await env.SUBSCRIBERS_KV.put(email, JSON.stringify({
              ...existingData,
              subscribed_at: timestamp,
              source,
              ip,
              referrer,
              confirm_token: confirmToken,
            }), { expirationTtl: 60 * 60 * 24 * 90 });
            return json({ ok: true, already_pending: true });
          }
        }
      } catch (err) {
        console.error('Subscriber lookup failed:', err);
        // Non-fatal: continue with insert
      }

      // Durable record FIRST
      try {
        await env.SUBSCRIBERS_KV.put(email, JSON.stringify({
          email,
          name: name || null,
          source,
          status: 'pending', // TODO: flip to 'subscribed' after double opt-in confirmation
          confirm_token: confirmToken, // TODO: use for double opt-in email link
          timestamp,
          ip,
          referrer,
        }), { expirationTtl: 60 * 60 * 24 * 90 });
      } catch (err) {
        console.error('KV write failed:', err);
        return json({ ok: false, error: 'internal_error' }, 500);
      }

      // TODO: Send confirmation email via Email Sending binding when available
      // For now, the subscribe endpoint records the intent but does not send
      // the confirmation email. The admin can manually send welcomes or
      // migrate to the Email Sending binding when ready.
      let notified = false;
      try {
        await env.NOTIFY.send({
          from: 'notifications@macdougallemail.com',
          to: NOTIFY_ADDRESS,
          subject: `New brief subscriber: ${email}`,
          text: `Email: ${email}\nName: ${name || '(none)'}\nSource: ${source}\nStatus: pending (awaiting confirmation)\nTimestamp: ${timestamp}\nIP: ${ip}\nReferrer: ${referrer}\nConfirm token: ${confirmToken}`,
        });
        notified = true;
      } catch (err) {
        console.error('Subscribe notification email failed:', err);
      }

      if (!notified) {
        console.warn('Subscriber recorded to KV only — check the namespace.');
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
// 2026-09-22: Added /api/subscribe endpoint, SUBSCRIBERS_KV namespace required.
