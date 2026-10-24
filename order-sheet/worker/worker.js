// Cloudflare Worker: receives Shopify webhooks, verifies the signature, forwards to the Google Apps Script.
// Why a Worker: Apps Script cannot read request headers, so it cannot verify Shopify's HMAC itself.
//
// Secrets (set with `wrangler secret put NAME`):
//   SHOPIFY_WEBHOOK_SECRET  signing secret shown in Shopify (Settings > Notifications > Webhooks)
//   APPS_SCRIPT_URL         the deployed Apps Script web app URL
//   SHARED_SECRET           random string; must equal Script Property SHARED_SECRET
//
// Behaviour: replies 200 only when the sheet confirms the write. Any other result returns 5xx so
// Shopify retries the delivery. The Apps Script upserts by order id, so retries never duplicate rows.

async function verifyHmac(body, headerValue, secret) {
  if (!headerValue) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  let sig;
  try {
    sig = Uint8Array.from(atob(headerValue), (c) => c.charCodeAt(0));
  } catch (e) {
    return false;
  }
  return crypto.subtle.verify('HMAC', key, sig, enc.encode(body));
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('ok', { status: 200 });

    const body = await request.text();
    const valid = await verifyHmac(body, request.headers.get('X-Shopify-Hmac-Sha256'), env.SHOPIFY_WEBHOOK_SECRET);
    if (!valid) return new Response('unauthorized', { status: 401 });

    let payload;
    try {
      payload = JSON.parse(body);
    } catch (e) {
      return new Response('bad json', { status: 400 });
    }

    let res;
    try {
      res = await fetch(env.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        body: JSON.stringify({
          secret: env.SHARED_SECRET,
          topic: request.headers.get('X-Shopify-Topic'),
          webhookId: request.headers.get('X-Shopify-Webhook-Id'),
          shopDomain: request.headers.get('X-Shopify-Shop-Domain'),
          payload,
        }),
      });
    } catch (e) {
      return new Response('forward failed', { status: 502 });
    }
    if (!res.ok) return new Response('sheet unavailable', { status: 502 });

    let out = {};
    try {
      out = await res.json();
    } catch (e) {
      return new Response('bad sheet reply', { status: 502 });
    }
    if (out.ok !== true) return new Response('sheet rejected', { status: 502 });
    return new Response('ok', { status: 200 });
  },
};
