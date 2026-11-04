---
title: The plugin definition
description: Every field of definePlugin(), from the id and version to settings, migrations and setup().
order: 2
---

A plugin's package exports one definition, made with `definePlugin()`. The function only helps
TypeScript; the CMS checks the definition when the site starts and leaves a plugin with an
invalid one out, with the reason on the Plugins screen.

```ts filename="src/index.ts"
import { definePlugin } from '@otwdesign/sdk'

export default definePlugin({
  id: 'events',
  version: '1.2.0',
  name: 'Events',
  description: 'Event listings with dates and venues.',
  icon: 'calendar',
  requires: { core: '^1.0.0' },
  optional: { commerce: '^1.0.0' },
  migrations: [],
  settings: {},
  setup(cms) {
    cms.logger.info('Events is running', { version: cms.plugin.version })
  },
})
```

## Fields

| Field         | Required | What it is                                                                                           |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `id`          | Yes      | Lowercase kebab-case (`events`, `commerce-stripe`), unique on the site.                              |
| `version`     | Yes      | The plugin's version, as [semver](https://semver.org). Shown on the Plugins screen.                  |
| `name`        | No       | The name the admin shows. Defaults to the id.                                                        |
| `description` | No       | One sentence for the Plugins screen.                                                                 |
| `icon`        | No       | The menu icon of the plugin's admin section. Defaults to `admin`, a gear.                            |
| `requires`    | No       | Plugins it can't work without, and `core`, each with a semver range.                                 |
| `optional`    | No       | Plugins it works with when they're there. See [Dependencies](/plugins/getting-started/dependencies). |
| `migrations`  | No       | Changes to the database, run once each. See [Migrations](/plugins/database/migrations).              |
| `settings`    | No       | The plugin's settings. See [Settings](/plugins/admin/settings).                                      |
| `setup`       | No       | Registers what every part of the site needs. See [setup()](#setup) below.                            |

### The id

The id is the plugin's namespace. Its settings, hooks, capabilities and registries start with it
(`events.date_format`, `events.event.published`), its admin pages live under `/admin/{id}`, and
its API routes under `/api/p/{id}`. Pick it once: changing it is like publishing a new plugin.

A few ids are taken by the CMS: `core`, `admin`, `api`, `login`, `logout`, `setup`, `plugins`,
`settings`, `users`, `updates`, `posts`, `pages` and `media`.

### The icon

The icon is a built-in name: `admin`, `dashboard`, `post`, `plugins`, `users`, `settings`, `cart`,
`products`, `payments`, `chart`, `book`, `groups`, `media`, `page`, `tools`, `megaphone` or
`calendar`. Or it's an SVG of your own, as a base64 data URI, as WordPress's `add_menu_page()`
accepts. The admin draws it as a mask in the menu's colours, so only its shape counts.
`ADMIN_ICON_NAMES` lists the built-in names, and `isAdminIcon()` tells whether a value is one of them
or a data URI the admin accepts, for a plugin that lets its users pick an icon.

```ts
const icon = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">…</svg>')}`
```

## setup()

`setup(cms)` is where a plugin registers what every part of the site needs: hooks, routes,
services, site slots, roles and capabilities. It runs every time the site starts, after the
plugins it depends on and after its own migrations. It may be `async`. Admin pages, actions,
settings pages and admin slots go in the plugin's [admin entry](/plugins/admin#the-admin-entry),
which runs after every plugin's `setup()`, only where the admin is.

Its argument, `cms`, is the plugin's view of the CMS:

| Property          | What it's for                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `cms.plugin`      | This plugin's `id` and `version`.                                                             |
| `cms.hooks`       | [Actions and filters](/plugins/hooks).                                                        |
| `cms.registries`  | [Registries](/plugins/registries-and-services#registries) of its own and other plugins'.      |
| `cms.services`    | [Services](/plugins/registries-and-services#services) it offers and uses.                     |
| `cms.routes`      | [Pages and API routes](/plugins/pages-and-routes).                                            |
| `cms.slots`       | [Slots](/plugins/slots) it fills and offers.                                                  |
| `cms.settings`    | Reads [settings](/plugins/admin/settings), its own and others'.                               |
| `cms.auth`        | [Roles and capabilities](/plugins/users-and-capabilities).                                    |
| `cms.admin`       | [Admin screens](/plugins/admin), form actions and settings pages.                             |
| `cms.logger`      | Logs with the plugin's id attached.                                                           |
| `cms.db`          | [The database](/plugins/database). Read it when you use it, never store it.                   |
| `cms.transaction` | Runs work in [a transaction](/plugins/database#transactions).                                 |
| `cms.when`        | Integrates with an [optional plugin](/plugins/getting-started/dependencies#optional-plugins). |
| `cms.isActive`    | Whether another plugin is active.                                                             |

Registration happens in `setup()` and nowhere else. Once the site has started, the CMS seals what
was registered: adding a hook or a route later throws "Cannot register … after boot".

> [!TIP]
> Keep `setup()` fast and side-effect free: no network calls, no writes. It runs on every start,
> and again whenever an administrator activates a plugin or saves settings.

## When setup() throws

A plugin whose `setup()` or migrations throw is left out, and so is every plugin that requires
it. The site starts without them, and the Plugins screen shows the error. In tests,
`@otwdesign/testing` turns this off so the test fails instead; see [Testing](/plugins/testing).
