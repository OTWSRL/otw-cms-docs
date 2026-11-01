---
title: Forms and actions
description: Handle the forms on your admin screens with admin actions. The CMS checks the session, capability and origin, and the result becomes a redirect with a message.
order: 1
---

An admin form posts to an **admin action**. The CMS does the dangerous parts before your code
runs: it checks that the post came from this site, that someone is signed in, and that they have
the action's capability. Your handler then does the work and says where to go next.

## Adding actions

Here are the two actions the [Announcements screens](/plugins/admin) post to. The table and the
capability are the ones from that page:

```ts filename="src/schema.ts"
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const announcements = pgTable('announcements_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

declare module '@otw/sdk' {
  interface Capabilities {
    /** Add and delete announcements. */
    'announcements.manage': true
  }
}
```

```ts filename="src/actions.ts"
import { ActionError, type PluginContext } from '@otw/sdk'
import { eq } from 'drizzle-orm'
import { announcements } from './schema'

const MAX_MESSAGE = 500
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function field(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

export function registerActions(cms: PluginContext) {
  cms.admin.action({
    name: 'create',
    capability: 'announcements.manage',
    async handler({ form }) {
      const message = field(form, 'message')
      if (!message || message.length > MAX_MESSAGE) {
        // Shown on the form the user posted, so they can fix it.
        throw new ActionError(`Write a message of up to ${MAX_MESSAGE} characters.`)
      }
      await cms.db.insert(announcements).values({ message })
      return { redirect: cms.admin.url('announcements.list'), notice: 'Announcement published.' }
    },
  })

  cms.admin.action({
    name: 'delete',
    capability: 'announcements.manage',
    async handler({ form, user }) {
      const id = field(form, 'id')
      if (!UUID.test(id)) throw new ActionError('That announcement no longer exists.')
      await cms.db.delete(announcements).where(eq(announcements.id, id))
      cms.logger.info('Announcement deleted', { id, by: user.id })
      // No redirect: back to the page the form was on.
      return { notice: 'Announcement deleted.' }
    },
  })
}
```

Call `registerActions(cms)` from the plugin's `setup()`. Forms post to
`cms.admin.actionUrl('create')`, which is `/api/p/announcements/actions/create`.

## What the CMS checks first

1. **The post came from this site.** It must carry this site's `Origin` header, which browsers
   send with every form post. Anything else gets a 403, which stops other sites from posting
   forms to yours (cross-site request forgery).
2. **The body is a form** (`application/x-www-form-urlencoded` or `multipart/form-data`).
3. **Someone is signed in.** Signed-out visitors are sent to sign in, then back.
4. **They have the action's capability.** Otherwise: 403.

There's no nonce to add: the origin check does that job, so a plain `<form method="post">`
is safe.

## What the handler returns

| Return         | Then                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------- |
| `{ notice }`   | Back to the page the form was on, with the message shown once at the top.                 |
| `{ redirect }` | To that path instead, such as the list after creating something. It must be on this site. |
| nothing        | Back to the page the form was on, with no message.                                        |

The CMS always answers with a redirect (303), so refreshing the next page never posts the form
again. The message travels in the URL, signed, so it can't be forged.

## Errors

- **`ActionError`**: a problem the user can fix. Its message is shown on the page the form was
  on, as an error.
- **`ForbiddenError`**: the user may not act on _this_ object, for example a
  [meta capability](/plugins/users-and-capabilities/meta-capabilities) check on the loaded
  record. Answers 403.
- **Anything else** is logged with the plugin, the action and the user, and the page shows
  "Something went wrong. Check the server log."

## Validate everything

Form values are strings, and anything can be posted, so check each one: trim it, check its length
and format, and look up any id it names. Don't trust hidden fields: they're as easy to change as
the rest.

## One-button forms

For a button that posts on its own, such as **Delete** in a row's actions, use `FormButton` from
`@otw/admin-ui`: it renders a small form with hidden fields.

```tsx
<FormButton action={cms.admin.actionUrl('delete')} fields={{ id: item.id }} variant="delete">
  Delete
</FormButton>
```
