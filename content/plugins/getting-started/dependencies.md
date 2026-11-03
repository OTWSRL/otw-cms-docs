---
title: Dependencies
description: Require other plugins and versions of the CMS, integrate with optional plugins, and how load order follows.
order: 3
---

Big plugins build on each other: a payment plugin needs the shop, a course plugin sells through
it if it's there. A plugin says so in its definition, and the CMS does the rest: it loads
dependencies first, refuses to activate a plugin whose requirements aren't met, and keeps
optional integrations from running against versions they don't support.

## Requiring a plugin

`requires` names the plugins a plugin can't work without, with the versions it supports, plus the
CMS itself as `core`:

```ts filename="src/index.ts"
import { definePlugin } from '@otwdesign/sdk'
import type {} from '@otwdesign/plugin-commerce'

export default definePlugin({
  id: 'gift-cards',
  version: '1.0.0',
  requires: { core: '^1.0.0', commerce: '^1.0.0' },
  setup(cms) {
    const commerce = cms.services.get('commerce')
    cms.logger.info('Selling in', { currency: commerce.currency })
  },
})
```

The empty `import type {} from '@otwdesign/plugin-commerce'` loads Commerce's declarations, so the
`commerce` service, its hooks and its registries are typed here. It costs nothing at runtime.

With `requires`:

- Commerce loads and sets up before Gift Cards, so its services and registries exist.
- Gift Cards can't be activated while Commerce is inactive, and Commerce can't be deactivated
  while Gift Cards is active. The Plugins screen explains why.
- If the installed Commerce is outside `^1.0.0`, or fails to load, Gift Cards is left out, with
  the reason.

Ranges are [semver ranges](https://github.com/npm/node-semver#ranges), as npm uses them.

## Optional plugins

`optional` names plugins a plugin works without, but integrates with when they're active. Put the
integration in `cms.when()`: it runs only if that plugin is active, loaded first, and within the
range.

```ts filename="src/index.ts"
import { definePlugin } from '@otwdesign/sdk'
import type {} from '@otwdesign/plugin-commerce'

export default definePlugin({
  id: 'newsletter',
  version: '1.0.0',
  requires: { core: '^1.0.0' },
  optional: { commerce: '^1.0.0' },
  async setup(cms) {
    // Works alone; subscribes buyers when the shop is active too.
    await cms.when('commerce', () => {
      cms.hooks.addAction('commerce.order.paid', async ({ order }) => {
        cms.logger.info('Subscribing a buyer', { order: order.id })
      })
    })
  },
})
```

If the optional plugin is active but its version is outside the range, the integration stays off
and the Dashboard shows a warning: `"newsletter" supports "commerce" ^1.0.0 but found 2.0.0;
integration disabled`.

`cms.when()` only accepts plugins named in `requires` or `optional`; any other id throws, so a
missing declaration shows up the first time the code runs. `cms.isActive(id)` answers the plain
question for any plugin.

## Load order

The CMS sorts active plugins so every plugin sets up after the ones it requires or optionally
uses. Plugins that don't depend on each other load in alphabetical order of their ids, so the
order is the same on every server. A cycle of
requirements can't be loaded; a cycle that runs through an optional dependency drops just that
integration.

Load order matters in a few places: actions with equal priority run in it, registry items are
listed in it, and the admin menu's plugin sections follow it.

## The CMS's version

`requires.core` is checked against the CMS's version. Use a caret range on the version you built
against (`^1.0.0`); when a new major version of the CMS changes something your plugin uses, the
range keeps it from loading on a CMS it would break on. For npm, say the same in the package's
peer dependency on `@otwdesign/sdk`; see [Publishing](/plugins/publishing).
