---
title: Email
description: Send email from a plugin with cms.mail.send(), change messages with the mail.message filter, and make a plugin that delivers the site's email, as WordPress's wp_mail() and its SMTP plugins do.
order: 7.8
---

`cms.mail` sends email, like WordPress's `wp_mail()`: password resets, order receipts, a form's
notifications. How the email leaves the site is a plugin's job, as WordPress's SMTP plugins
replace its mailer: one plugin provides the **transport** (SMTP, Postmark, Resend, Amazon SES),
and every plugin sends through it.

## Sending

```ts filename="src/receipts.ts"
import type { PluginContext } from '@otwdesign/sdk'

/** Emails a receipt; false when it couldn't be sent, which the caller can say. */
export function sendReceipt(cms: PluginContext, to: string, orderNumber: string) {
  return cms.mail.send({
    to,
    subject: `Your order ${orderNumber}`,
    text: `Thanks for your order. Its number is ${orderNumber}.`,
  })
}
```

| Field     | What it is                                                                               |
| --------- | ---------------------------------------------------------------------------------------- |
| `to`      | One address or a list of up to 50: `ada@example.com` or `Ada Admin <ada@example.com>`    |
| `subject` | One line                                                                                 |
| `text`    | The plain-text body, which every email has                                               |
| `html`    | An HTML body as well, optional                                                           |
| `from`    | Defaults to **Settings › General › Send email from** (`MAIL_FROM`), else the transport's |
| `replyTo` | Optional                                                                                 |

Like `wp_mail()`, `send()` returns `false` rather than throwing when the email can't go: the
transport failed, or the site has none. It logs why and runs the `mail.failed` action. A message
that isn't valid does throw: an address that isn't one, or a line break in the subject or an
address, which could add headers of its own.

Send after your transaction commits. An email can't be taken back, so one sent from inside a
transaction that later rolls back would describe something that never happened.

## Hooks

| Hook           | Kind   | When                                                       | Like WordPress's    |
| -------------- | ------ | ---------------------------------------------------------- | ------------------- |
| `mail.message` | Filter | Before sending: change recipients, subject, bodies, sender | `wp_mail`           |
| `mail.sent`    | Action | The transport took the message                             | `wp_mail_succeeded` |
| `mail.failed`  | Action | It couldn't be sent, with the reason in `error`            | `wp_mail_failed`    |

A filtered message is checked again before it's sent.

## Delivering the site's email

A transport has one method, `send()`, which delivers a checked message or throws with a reason
for the log. Provide it in `setup()`; only one plugin may. Here, one that posts to an email API
over HTTP:

```ts filename="src/index.ts"
import { definePlugin, type OutgoingMail } from '@otwdesign/sdk'

declare module '@otwdesign/sdk' {
  interface Settings {
    /** The email service's API token, from MAIL_API_TOKEN only. */
    'mail-api.token': string
  }
}

export default definePlugin({
  id: 'mail-api',
  version: '1.0.0',
  name: 'Mail API',
  requires: { core: '^1.0.0' },
  settings: {
    'mail-api.token': { type: 'secret', label: 'API token', env: 'MAIL_API_TOKEN' },
  },
  setup(cms) {
    cms.mail.transport({
      async send(message: OutgoingMail) {
        const response = await fetch('https://mail.example.com/v1/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cms.settings.get('mail-api.token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: message.from ?? 'My Site <hello@example.com>',
            to: message.to,
            subject: message.subject,
            text: message.text,
            html: message.html ?? undefined,
            reply_to: message.replyTo ?? undefined,
          }),
        })
        if (!response.ok) throw new Error(`The mail service answered ${response.status}`)
      },
    })
  },
})
```

`cms.mail.canSend()` says whether a transport is set up: the site's sign-up uses it, since it
can't work without email.

## Without a transport

With no mail plugin, nothing is sent. The server log says so, with the recipients and subject;
outside production it logs the text too, so you can follow a link while you build. In production
it never does: an email's text can hold a password reset link.

**Mail to files** (`@otwdesign/plugin-mail-file`) is a transport for development and tests: it writes
each email to a folder as a JSON file, `.data/mail` or
[`MAIL_FILE_DIR`](/hosting/environment-variables#mail_file_dir), as a mail catcher such as
Mailpit shows them. Never activate it on a live site: nothing reaches anyone. It isn't on npm yet.

## How it differs from WordPress

- **There's no built-in mailer.** WordPress falls back to PHP's `mail()`, which most hosts don't
  deliver; here a plugin chooses, and a site without one says so in its log.
- **Messages are checked twice**, before and after the filter, for addresses and line breaks.
- **Bodies stay out of production logs.**
