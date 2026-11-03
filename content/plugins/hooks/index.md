---
title: Hooks
description: Actions and filters, WordPress's way of letting plugins change each other's behaviour, typed in TypeScript.
order: 2
---

Hooks let one plugin run code inside another without either changing the other's source. OTW CMS
has WordPress's two kinds:

- **[Actions](/plugins/hooks/actions)** announce that something happened: "an order was paid".
  Other plugins run code when it does: send an email, enrol the buyer in a course.
- **[Filters](/plugins/hooks/filters)** pass a value through other plugins before it's used: a
  cart's totals go through `commerce.cart.totals`, where a discount plugin can add a discount.

Plugins also extend each other through [registries, services](/plugins/registries-and-services)
and [slots](/plugins/slots). Every kind is listed, with its type and where it's used, in the
[Code Reference](/reference).

## Hooks are typed

In WordPress a hook is a string, and a typo fails silently. Here each hook is declared, with its
payload's type, on an interface in `@otwdesign/sdk`:

```ts
declare module '@otwdesign/sdk' {
  interface Actions {
    'commerce.order.paid': { order: Order }
  }
}
```

So `cms.hooks.addAction('commerce.order.paid', ({ order }) => …)` knows `order` is an `Order`,
and a misspelled hook name is a type error. Import the declaring plugin's types once, with
`import type {} from '@otwdesign/plugin-commerce'`, to see its hooks. To declare your own, see
[Your own extension points](/plugins/hooks/extension-points).

## Priority

Handlers run in order of `priority`, lowest first; the default is 10, as in WordPress. Handlers
with the same priority run in the order plugins load.

```ts
cms.hooks.addFilter('commerce.cart.totals', addShipping, { priority: 20 })
```

## Where to hook

Add every handler in `setup()`. Handlers added later throw, because the CMS seals its hooks once
the site has started.

## When a handler fails

- **A throwing action handler** is logged with the plugin's id and skipped; the others still run,
  and so does the code that fired it. Inside a transaction it runs in a savepoint, so its failure
  can't roll back the operation it was told about.
- **A throwing filter handler** fails the whole operation, because carrying on would use a
  half-changed value: a checkout whose totals filter fails doesn't take payment.
