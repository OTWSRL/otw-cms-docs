---
title: Actions
description: Run code when something happens in the CMS or in another plugin, and fire actions of your own.
order: 1
---

An action is an announcement: something just happened. Any plugin can add a **handler** that runs
when it does, like WordPress's `add_action()`.

## Adding a handler

`cms.hooks.addAction(name, handler, options?)` takes the action's name and a function that
receives its **payload**. The handler may be `async`; the code that fired the action waits for it.

```ts filename="src/index.ts"
import { definePlugin } from '@otwdesign/sdk'
import type {} from '@otwdesign/plugin-commerce'

export default definePlugin({
  id: 'order-alerts',
  version: '1.0.0',
  requires: { core: '^1.0.0', commerce: '^1.0.0' },
  setup(cms) {
    cms.hooks.addAction('commerce.order.paid', async ({ order }) => {
      cms.logger.info('Order paid', { order: order.number, total: order.total })
    })

    // Runs before handlers at the default priority of 10.
    cms.hooks.addAction(
      'commerce.order.cancelled',
      ({ order }) => cms.logger.warn('Order cancelled', { order: order.number }),
      { priority: 5 },
    )
  },
})
```

Every action the CMS and its plugins fire is in the Code Reference under
[Actions](/reference/actions), with its payload and where it fires.

## Actions run inside transactions

Most actions fire inside the database transaction of the change they announce: Commerce fires
`commerce.order.paid` in the same transaction that marks the order paid. A handler that writes
through `cms.db` writes in that transaction, so its rows commit with the order, or not at all.

```ts filename="src/enrol.ts"
import type { PluginContext } from '@otwdesign/sdk'
import type {} from '@otwdesign/plugin-commerce'
import { sql } from 'drizzle-orm'

export function enrolBuyers(cms: PluginContext) {
  cms.hooks.addAction('commerce.order.paid', async ({ order }) => {
    // cms.db is the order's transaction here.
    for (const line of order.lines.filter((l) => l.itemType === 'course')) {
      await cms.db.execute(
        sql`INSERT INTO lms_enrolments (email, course_id) VALUES (${order.email}, ${line.itemId})`,
      )
    }
  })
}
```

If your handler throws, the CMS logs it and rolls back just your handler's writes (they run in a
savepoint), and the order is still paid. Don't call slow services, such as an email provider,
from a handler that runs inside a transaction: the transaction stays open until you return.

## Firing your own

A plugin fires its own actions with `cms.hooks.doAction(name, payload)`, after declaring them so
other plugins get the types. See [Your own extension points](/plugins/hooks/extension-points).

```ts
await cms.hooks.doAction('events.event.published', { event })
```

`doAction` resolves when every handler has finished. It never rejects because of a handler.
