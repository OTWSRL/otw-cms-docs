---
title: Filters
description: Change a value another plugin is about to use, such as a cart's totals, and offer filters of your own.
order: 2
---

A filter passes a value through every handler before the plugin that owns it uses it. Each
handler receives the value and returns it, changed or not, like WordPress's `add_filter()`.

## Adding a handler

`cms.hooks.addFilter(name, handler, options?)`. The handler receives the **value** and a
**context** with what else it might need, and returns the new value. It may be `async`.

Commerce passes every cart's totals through `commerce.cart.totals` before checkout. A discount
plugin adds an adjustment:

```ts filename="src/index.ts"
import { definePlugin } from '@otwdesign/sdk'
import type {} from '@otwdesign/plugin-commerce'

export default definePlugin({
  id: 'bulk-discount',
  version: '1.0.0',
  requires: { core: '^1.0.0', commerce: '^1.0.0' },
  setup(cms) {
    cms.hooks.addFilter('commerce.cart.totals', (totals, { lines }) => {
      const items = lines.reduce((sum, line) => sum + line.quantity, 0)
      if (items < 10) return totals
      return {
        ...totals,
        adjustments: [
          ...totals.adjustments,
          { code: 'bulk', label: '10% off 10 or more', amount: -Math.round(totals.subtotal / 10) },
        ],
      }
    })
  },
})
```

Commerce recomputes the total from the subtotal and the adjustments after the filter, so the
handler only adds its line. Amounts are integers in the currency's minor unit (cents for USD).

Every filter is in the Code Reference under [Filters](/reference/filters), with the value and
context it passes.

## Rules for handlers

- **Return the value.** A handler that returns nothing hands `undefined` to the next one.
- **Don't change the value in place**; return a new one, as above. Other handlers may hold the
  old one.
- **Throw only if the operation must fail.** A throwing filter handler fails the whole operation:
  a checkout whose totals can't be worked out doesn't happen.

## Offering your own

A plugin passes a value through its own filter with `cms.hooks.applyFilters(name, value, context)`,
after declaring it. See [Your own extension points](/plugins/hooks/extension-points).

```ts
const title = await cms.hooks.applyFilters('events.event.title', event.title, { event })
```
