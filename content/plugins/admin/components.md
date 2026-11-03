---
title: Components
description: Build admin screens from @otwdesign/admin-ui. List tables, form tables, buttons, notices and boxes in WordPress's markup, ready for phones.
order: 2
---

`@otwdesign/admin-ui` renders WordPress's admin markup and class names (`wp-list-table`,
`form-table`, `button-primary`, `notice-warning`, `postbox`), which the admin's stylesheet
styles. Screens built from it look like the rest of the admin, work on phones, and keep up as the
admin changes. Add it as a peer dependency, like `@otwdesign/sdk`.

| Component                            | What it is                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| `ListTable`                          | `WP_List_Table`: striped rows, row actions, a checkbox column, and a phone layout. |
| `Views`                              | The filter links above a list: All (12) · Pending (3).                             |
| `TableNav`                           | The bar above a list: the count, paging, and bulk controls.                        |
| `RowActions`                         | The links under a row's main column, for tables built by hand.                     |
| `FormTable`, `FormField`             | `.form-table`: labels on the left, fields on the right, stacked on phones.         |
| `SubmitButton`                       | The primary button under a form.                                                   |
| `Button`, `ButtonLink`, `FormButton` | Buttons and button-styled links; `FormButton` posts on its own.                    |
| `Notice`                             | A notice: `info`, `success`, `warning` or `error`, optionally dismissible.         |
| `Postbox`                            | A box with a title bar, as on the Dashboard and edit screens.                      |
| `EditColumns`                        | An edit screen's two columns: the main form, and boxes on the side.                |
| `AdminIcon`                          | One of the admin's icons.                                                          |

Every component and its props are in the Code Reference under
[`@otwdesign/admin-ui`](/reference/packages/admin-ui).

## A list with filters and bulk actions

```tsx filename="src/orders-list.tsx"
import { Button, ListTable, TableNav, Views } from '@otwdesign/admin-ui'

interface Ticket {
  id: string
  subject: string
  status: 'open' | 'closed'
  replies: number
}

export function TicketList({
  tickets,
  status,
  closeUrl,
}: {
  tickets: Ticket[]
  status: 'open' | 'closed' | undefined
  closeUrl: string
}) {
  const count = (s: Ticket['status']) => tickets.filter((ticket) => ticket.status === s).length
  const shown = status ? tickets.filter((ticket) => ticket.status === status) : tickets
  return (
    <>
      <Views
        label="Filter tickets"
        views={[
          { label: 'All', href: '/admin/support', count: tickets.length, current: !status },
          {
            label: 'Open',
            href: '/admin/support?status=open',
            count: count('open'),
            current: status === 'open',
          },
          {
            label: 'Closed',
            href: '/admin/support?status=closed',
            count: count('closed'),
            current: status === 'closed',
          },
        ]}
      />
      {/* The checkboxes and the bulk button share one form. */}
      <form method="post" action={closeUrl}>
        <TableNav total={shown.length} noun={['ticket', 'tickets']}>
          <Button type="submit">Close selected</Button>
        </TableNav>
        <ListTable
          caption="Support tickets"
          rows={shown}
          rowKey={(ticket) => ticket.id}
          select={{ name: 'ids', value: (ticket) => ticket.id, label: (ticket) => ticket.subject }}
          columns={[
            {
              key: 'subject',
              label: 'Subject',
              render: (ticket) => <strong>{ticket.subject}</strong>,
            },
            { key: 'status', label: 'Status', render: (ticket) => ticket.status },
            { key: 'replies', label: 'Replies', numeric: true, render: (ticket) => ticket.replies },
          ]}
          empty="No tickets found."
        />
      </form>
    </>
  )
}
```

On phones, the table shows only its primary column (the first, unless a column says
`primary: true`), with a toggle on each row for the rest; each value is labelled with its
column's `label`. Numeric columns align right with even-width figures.

## An edit screen

```tsx filename="src/edit-ticket.tsx"
import {
  EditColumns,
  FormField,
  FormTable,
  Notice,
  Postbox,
  SubmitButton,
} from '@otwdesign/admin-ui'

export function EditTicket({ subject, saveUrl }: { subject: string; saveUrl: string }) {
  return (
    <form method="post" action={saveUrl}>
      <EditColumns
        main={
          <>
            <Notice type="warning">This ticket has been waiting for three days.</Notice>
            <FormTable>
              <FormField label="Subject" htmlFor="subject" description="Customers see this.">
                <input
                  id="subject"
                  name="subject"
                  defaultValue={subject}
                  className="regular-text"
                />
              </FormField>
            </FormTable>
          </>
        }
        side={
          <Postbox id="ticket-publish" title="Save">
            <SubmitButton>Update</SubmitButton>
          </Postbox>
        }
      />
    </form>
  )
}
```

## WordPress's markup by hand

The admin styles WordPress's class names wherever they appear, so markup copied from a WordPress
plugin works too: `wrap`, `button`, `button-primary`, `notice notice-error`, `form-table`,
`regular-text`, `large-text`, `description`, `wp-list-table widefat striped`, `postbox`,
`subsubsub` and `row-actions`. Prefer the components where they exist: they handle accessibility
and phones for you.

## What the CMS adds around a screen

Don't render these yourself: the CMS puts them around every screen's component.

- The `<h1>` title, from the page's `title`, and the `titleAction` button beside it.
- Notices from plugins (the `admin.notices` slot), and the message from the last action.
- The menu, the admin bar and the footer.
