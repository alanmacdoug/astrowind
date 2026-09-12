export interface Env {
  SENDGRID_API_KEY?: string;
  CONTACT_FROM?: string;
  CONTACT_TO?: string;
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

    if (request.method === 'POST' && url.pathname === '/api/contact') {
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

    return json({ ok: false, error: 'not_found' }, 404);
  },
};
