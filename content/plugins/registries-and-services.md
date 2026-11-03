---
title: Registries and services
description: Add items to another plugin's registry, such as a payment gateway, and call the APIs other plugins provide.
order: 3
---

Hooks change what happens at a moment in time. Registries and services are the other two ways
plugins build on each other:

- A **registry** is a list one plugin owns and others add to: Commerce's payment gateways and
  the kinds of things it sells.
- A **service** is an API one plugin offers the plugins that depend on it: Commerce's `commerce`
  service creates products, quotes carts and marks orders paid.

## Registries

`cms.registries.get(name)` returns another plugin's registry; `add(item)` adds to it during
`setup()`. Every item has an `id`, unique in its registry. Commerce lists its gateways at
checkout, so adding one is all a payment plugin needs to appear there:

```ts filename="src/index.ts"
import { definePlugin } from '@otwdesign/sdk'
import type {} from '@otwdesign/plugin-commerce'

export default definePlugin({
  id: 'bank-transfer',
  version: '1.0.0',
  name: 'Bank transfer',
  requires: { core: '^1.0.0', commerce: '^1.0.0' },
  setup(cms) {
    cms.registries.get('commerce.gateways').add({
      id: 'bank-transfer',
      label: 'Bank transfer',
      description: 'Pay into our account; we ship when the money arrives.',
      // Nothing to do now: the order waits, pending, until someone marks it paid.
      createPayment: async () => ({ type: 'none' }),
    })
  },
})
```

A gateway that sends buyers to a payment page returns `{ type: 'redirect', url }` instead, and
confirms the payment later with the `commerce` service's `markPaid()`, usually from a webhook.
The Stripe plugin does exactly this.

Commerce sells more than products through its `commerce.purchasables` registry. A course plugin
registers its own kind of item, and Commerce prices it, checks it out and fires
`commerce.order.paid` with it, without knowing what a course is:

```ts filename="src/courses.ts"
import type { PluginContext } from '@otwdesign/sdk'
import type {} from '@otwdesign/plugin-commerce'

interface Course {
  id: string
  title: string
  price: number
}

const courses: Course[] = [{ id: 'intro', title: 'Introduction to OTW CMS', price: 4900 }]

export function sellCourses(cms: PluginContext) {
  cms.registries.get('commerce.purchasables').add({
    id: 'course',
    // One call per checkout with every course id in the cart. Return only those for sale.
    async resolveMany(ids) {
      const found = courses.filter((course) => ids.includes(course.id))
      return new Map(
        found.map((course) => [course.id, { title: course.title, unitPrice: course.price }]),
      )
    },
  })
}
```

The [Courses plugin](/documentation/courses) is the full version. It prices courses only inside its
own checkout, which runs the `commerce` service's `checkout()` for the signed-in learner, so its
`commerce.order.created` handler knows whose order it is, and its `commerce.order.paid` handler
enrolls them in the same transaction as the payment.

### Rules

- `get()` throws if the registry isn't defined, so **require** its owner, or put the code in
  [`cms.when()`](/plugins/getting-started/dependencies#optional-plugins) for an optional one.
- Adding an id the registry already has throws, and fails your plugin's setup. Use your plugin's
  id, or start with it.
- Items are listed in the order they were added, which follows the order plugins load.

To offer a registry of your own, see [Your own extension points](/plugins/hooks/extension-points).

## Services

`cms.services.get(name)` returns another plugin's service, typed by its declaration:

```ts filename="src/report.ts"
import type { PluginContext } from '@otwdesign/sdk'
import type {} from '@otwdesign/plugin-commerce'

export async function pendingOrdersSummary(cms: PluginContext): Promise<string> {
  const commerce = cms.services.get('commerce')
  const { orders, total } = await commerce.listOrders({ status: 'pending', limit: 5 })
  const amounts = orders.map((order) => commerce.formatMoney(order.total))
  return `${total} pending: ${amounts.join(', ')}`
}
```

- `get()` throws if no active plugin provides the service: require the provider, or use
  `cms.when()`.
- Calls run with the caller's `cms.db`, so a service call inside your transaction is part of it.
- Each service has one provider; a second plugin providing the same name fails to set up.

Use services, not other plugins' tables. A plugin's tables can change in any release; its
service is what it promises to keep working. To provide a service, see
[Your own extension points](/plugins/hooks/extension-points).
