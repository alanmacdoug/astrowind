import { CSP } from './csp-generated';

export interface Env {
  SENDGRID_API_KEY?: string;
  CONTACT_FROM?: string;
  CONTACT_TO?: string;
  ASSETS: Fetcher;
}

interface Payload {
  name?: string;
  email?: string;
  message?: string;
  website?: string; // honeypot
}

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

      // Not-yet-active mode: mail key or sender address unconfigured (domain pending).
      if (!env.SENDGRID_API_KEY || !env.CONTACT_FROM || !env.CONTACT_TO) {
        return json({ ok: false, notActive: true }, 503);
      }

      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.SENDGRID_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: env.CONTACT_TO }] }],
          from: { email: env.CONTACT_FROM },
          reply_to: { email: email },
          subject: `Website enquiry from ${name}`,
          content: [{ type: 'text/plain', value: `From: ${name} <${email}>\n\n${message}` }],
        }),
      });

      if (!res.ok) return json({ ok: false, error: 'send_failed' }, 502);
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
