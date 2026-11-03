---
title: Security
description: What the CMS protects for you, and what a plugin must do itself. Output, input, SQL, capabilities, webhooks, secrets and logs.
order: 10
---

Plugins run inside the site with full access, as WordPress plugins and npm packages do. The CMS
can't sandbox them, so each plugin is responsible for its own code. It does take the most common
mistakes off the table, though.

## What the CMS does for you

- **Escaping.** Components render through React, which escapes every value. There's no
  `esc_html()` to forget.
- **Request forgery.** Admin actions only accept posts carrying this site's `Origin`, and unsafe
  requests to API routes are refused when they carry another site's, and are anonymous when they
  carry none. No nonces to add.
- **Capabilities.** Admin pages and actions check their capability before your code runs.
- **Sessions and passwords.** Passwords are hashed with scrypt; sessions are random tokens stored
  only as hashes; the session cookie is `HttpOnly` and `SameSite=Lax`, and `Secure` with a
  `__Host-` name on HTTPS; failed sign-ins are throttled.
- **Redirects.** An action's `redirect` must be a path on this site; anything else is ignored.
- **Messages.** The one-time messages after an action are signed, so a crafted link can't make
  the admin show someone else's words.

## What your plugin must do

### Don't bypass escaping

Never build HTML strings, and treat `dangerouslySetInnerHTML` as a last resort for HTML you
produced yourself from trusted input. To show user-written formatting, render it to React
elements, or sanitize it with an allowlist.

### Validate every input

Everything a request carries can be forged: form fields (hidden ones included), query strings,
route parameters, JSON bodies and headers. Check type, length, format and range before you use a
value, and look up ids to make sure the thing exists and the user may touch it.

### Keep SQL parameterized

Drizzle's query builder and its `sql` template both send values as parameters:

```ts
cms.db.execute(sql`SELECT * FROM lms_courses WHERE slug = ${slug}`) // safe: slug is a parameter
```

Never pass input to `sql.raw()`, and never build a query with string concatenation.

### Check capabilities on objects

A capability on the page says the user may manage orders; it doesn't say they may cancel _this_
one. Check [meta capabilities](/plugins/users-and-capabilities/meta-capabilities) on the loaded
object, and throw `ForbiddenError` when the answer is no.

### Check who's calling your API routes

[API routes](/plugins/pages-and-routes#api-routes) are public: anyone can call them. Before a
handler does anything only some people may do, get the user with `context.user()` and check their
capability with `cms.auth.can()`; for calls from other servers, check a signature. Keep `GET`
handlers free of changes, since another site can make a visitor's browser open them. See
[Who can call it](/plugins/pages-and-routes#who-can-call-it).

## Webhooks

A webhook is an API route another server calls: a payment provider saying an order was paid.
Anyone can call the same URL, so:

1. **Verify the signature** over the raw body, before parsing it, with a constant-time comparison.
2. **Make it idempotent.** Providers retry, so the same event can arrive twice. Record what you
   handled, and do nothing the second time. Commerce's `markPaid()` already ignores orders that
   are paid.
3. **Answer quickly** with a 2xx, and keep the work small.

```ts filename="src/webhook.ts"
import { HttpError, type PluginContext } from '@otwdesign/sdk'
import { sql } from 'drizzle-orm'
import { createHmac, timingSafeEqual } from 'node:crypto'

declare module '@otwdesign/sdk' {
  interface Settings {
    /** Signs the shipping provider's webhook requests. */
    'shipping.webhookSecret': string
  }
}

function signatureMatches(secret: string, body: string, header: string | null): boolean {
  if (!header) return false
  const expected = createHmac('sha256', secret).update(body).digest()
  const given = Buffer.from(header, 'hex')
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export function registerWebhook(cms: PluginContext) {
  cms.routes.api({
    method: 'POST',
    path: '/webhook',
    handler: async (request) => {
      const secret = cms.settings.get('shipping.webhookSecret')
      if (!secret) throw new HttpError(503, 'Webhooks are not set up')
      const body = await request.text()
      if (!signatureMatches(secret, body, request.headers.get('x-signature'))) {
        throw new HttpError(401, 'Invalid signature')
      }
      let event: { id: string; type: string }
      try {
        event = JSON.parse(body) as { id: string; type: string }
      } catch {
        throw new HttpError(400, 'Expected JSON')
      }
      // A retry of an event already handled inserts nothing, and stops here.
      const result = (await cms.db.execute(
        sql`INSERT INTO shipping_events (id) VALUES (${event.id}) ON CONFLICT DO NOTHING RETURNING id`,
      )) as unknown as { rows: unknown[] }
      if (result.rows.length > 0)
        cms.logger.info('Shipment update', { event: event.id, type: event.type })
      return new Response(null, { status: 204 })
    },
  })
}
```

The Stripe plugin is the full example: it verifies Stripe's signature with Stripe's SDK, and
relies on `markPaid()` to ignore repeats.

## Secrets

Keys and signing secrets belong in [secret settings](/plugins/admin/settings#secrets), which come
only from the environment, and are never stored or shown. Never put them in code or log them.

## Logging

`cms.logger` adds your plugin's id to every entry. Log what helps someone fix a problem (ids,
statuses, the error) and never what would hurt if the log leaked: passwords, card numbers, full
tokens, session cookies.
