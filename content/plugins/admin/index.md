---
title: Admin screens
description: Add pages to the admin with their own menu entries, data, title buttons and capabilities.
order: 6
---

A plugin's admin screens look and behave like the CMS's own: the same menu, notices and
components, WordPress's markup. This chapter builds **Announcements**, a plugin with a list of
messages and a form to add one.

- This page: admin pages and the menu.
- [Forms and actions](/plugins/admin/actions): saving what the forms send.
- [Components](/plugins/admin/components): the list tables, form tables and boxes to build with.
- [Settings](/plugins/admin/settings): settings fields and settings pages.

## Adding a page

`cms.admin.page()` adds a screen under `/admin/{pluginId}`. The plugin keeps its data in a table
of its own, created by its migration (see [The database](/plugins/database)), and declares the
capability its screens need.

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

```tsx filename="src/index.tsx"
import { FormButton, FormField, FormTable, ListTable, SubmitButton } from '@otw/admin-ui'
import { definePlugin } from '@otw/sdk'
import { desc, sql } from 'drizzle-orm'
import { announcements } from './schema'

export default definePlugin({
  id: 'announcements',
  version: '1.0.0',
  name: 'Announcements',
  icon: 'megaphone',
  requires: { core: '^0.1.0' },
  migrations: [
    {
      id: '0001_items',
      up: (db) =>
        db.execute(sql`CREATE TABLE announcements_items (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          message text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )`),
    },
  ],

  setup(cms) {
    cms.auth.capability('announcements.manage', { label: 'Manage announcements' })

    cms.admin.page({
      name: 'list',
      path: '/',
      title: 'Announcements',
      capability: 'announcements.manage',
      menu: { label: 'All Announcements' },
      load: () => cms.db.select().from(announcements).orderBy(desc(announcements.createdAt)),
      titleAction: () => ({ label: 'Add New', url: cms.admin.url('announcements.new') }),
      component: ({ data }) => (
        <ListTable
          caption="Announcements"
          rows={data}
          rowKey={(item) => item.id}
          rowActions={(item) => [
            <FormButton
              key="delete"
              action={cms.admin.actionUrl('delete')}
              fields={{ id: item.id }}
              variant="delete"
            >
              Delete
            </FormButton>,
          ]}
          columns={[
            { key: 'message', label: 'Message', render: (item) => item.message },
            {
              key: 'date',
              label: 'Date',
              render: (item) => item.createdAt.toISOString().slice(0, 10),
            },
          ]}
          empty="No announcements yet."
        />
      ),
    })

    cms.admin.page({
      name: 'new',
      path: '/new',
      title: 'Add Announcement',
      capability: 'announcements.manage',
      menu: { label: 'Add New' },
      component: () => (
        <form method="post" action={cms.admin.actionUrl('create')}>
          <FormTable>
            <FormField label="Message" htmlFor="message">
              <textarea id="message" name="message" rows={3} className="large-text" required />
            </FormField>
          </FormTable>
          <SubmitButton>Publish</SubmitButton>
        </form>
      ),
    })
  },
})
```

The forms post to admin actions named `create` and `delete`; [Forms and actions](/plugins/admin/actions)
adds them.

## What a page takes

| Field         | What it is                                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | Unique in the plugin; others reach it as `{pluginId}.{name}`.                                                                                  |
| `path`        | Under `/admin/{pluginId}`: `/` is `/admin/announcements`, `/new` is `/admin/announcements/new`. `:name` segments are parameters, as in `/:id`. |
| `title`       | The heading and the browser tab, or a function of the page's props, such as an order's number.                                                 |
| `capability`  | Who may open it. Every admin screen also needs `core.access_admin`.                                                                            |
| `menu`        | Where it shows in the menu. Leave it out for pages reached from others, such as an edit form.                                                  |
| `load`        | Loads the page's data. Return `null` for a 404; throw `ForbiddenError` for a 403.                                                              |
| `titleAction` | A button beside the title, such as "Add New".                                                                                                  |
| `component`   | The screen's body. The title, notices and messages come from the CMS around it.                                                                |

Write `load` before `title` and `component`: TypeScript reads the object from top to bottom, and
takes `data`'s type from `load`.

## The menu

Every plugin with an admin page gets a section in the menu, with its `icon` and its `name`. The
section links to its first page and lists the rest beneath.

```ts
menu: { label: 'Sales report', order: 20, parent: 'commerce' }
```

- `label` is the menu entry's text.
- `order` sorts the entries in a section, lowest first (default 10).
- `parent` puts the page in another section instead: a core one (`dashboard`, `plugins`, `users`,
  `settings`) or another plugin's id. If that plugin isn't active, the page falls back to your
  own section, so pages for optional integrations still show.

People see only the entries whose capability they have.

## Links to admin pages

`cms.admin.url(name, params)` builds the URL of any plugin's admin page:
`cms.admin.url('commerce.order', { id: order.id })`. Use it for links and redirects, rather than
writing `/admin/...` by hand.
