---
title: Your first plugin
description: Write a plugin that adds a page to the site, a setting, and a Dashboard widget, then install and activate it.
order: 1
---

This plugin, **Greeting**, shows a message on its own page at `/hello` and in a box on the admin's
Dashboard. The message is a setting administrators can change. Along the way it uses the three
things nearly every plugin does: a route, a setting, and a slot.

## The package

A plugin is an npm package whose main export is its definition. The CMS compiles plugins from
their TypeScript source along with the site, so there's no build step: point `exports` at the
source.

```json filename="package.json"
{
  "name": "@acme/plugin-greeting",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.tsx",
    "./admin": "./src/admin.tsx"
  },
  "peerDependencies": {
    "@otwdesign/admin-ui": "^1.0.0",
    "@otwdesign/sdk": "^1.0.0",
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@otwdesign/admin-ui": "^1.0.0",
    "@otwdesign/sdk": "^1.0.0",
    "@otwdesign/testing": "^1.0.0",
    "@types/react": "^19.3.0",
    "react": "^19.3.0",
    "typescript": "~6.0.3",
    "vitest": "^5.0.0"
  }
}
```

The CMS's packages are **peer dependencies**: the site provides one copy that every plugin
shares. The range on `@otwdesign/sdk` also says which versions of the CMS the plugin works with; see
[Publishing](/plugins/publishing).

## The plugin

A plugin has two entries. The main one, `.`, runs everywhere: the site's pages, the API and the
admin. The admin entry, `./admin`, has what only the admin shows.

```tsx filename="src/index.tsx"
import { definePlugin } from '@otwdesign/sdk'

// Settings are typed: declare the key and its type, then the field in `settings` below.
declare module '@otwdesign/sdk' {
  interface Settings {
    /** What the greeting page and the Dashboard widget say. */
    'greeting.message': string
  }
}

export default definePlugin({
  id: 'greeting',
  version: '1.0.0',
  name: 'Greeting',
  description: 'Says hello on a page of its own and on the Dashboard.',
  icon: 'megaphone',
  requires: { core: '^1.0.0' },
  settings: {
    'greeting.message': {
      type: 'text',
      label: 'Message',
      default: 'Hello, world!',
      maxLength: 200,
    },
  },

  setup(cms) {
    // A page on the site, at /hello.
    cms.routes.page({
      name: 'hello',
      path: '/hello',
      metadata: () => ({ title: 'Hello' }),
      component: () => <h1>{cms.settings.get('greeting.message')}</h1>,
    })
  },
})
```

```tsx filename="src/admin.tsx"
import { Postbox } from '@otwdesign/admin-ui'
import { defineAdmin } from '@otwdesign/sdk'
import greeting from './index'

export default defineAdmin(greeting, (cms) => {
  // A box on the admin's Dashboard.
  cms.slots.fill('admin.dashboard', {
    component: () => (
      <Postbox id="greeting" title="Greeting">
        <p>{cms.settings.get('greeting.message')}</p>
      </Postbox>
    ),
  })
})
```

What each part does:

- **`declare module '@otwdesign/sdk'`** adds the setting's key and type to the CMS's `Settings`
  interface. From then on `cms.settings.get('greeting.message')` is typed `string | undefined`,
  in this plugin and in any plugin that reads it.
- **`id`** names the plugin everywhere: its settings start with `greeting.`, its admin pages
  live under `/admin/greeting`. See [The plugin definition](/plugins/getting-started/plugin-definition).
- **`requires: { core: '^1.0.0' }`** says which versions of the CMS it supports.
- **`settings`** declares the field. The admin shows it under **Settings › Greeting** without
  any more code, because the plugin didn't place it on a page of its own.
- **`setup(cms)`** runs when the site starts, with the plugin active. What every part of the
  site needs is registered here: pages, routes, settings readers, roles and capabilities.
- **`cms.routes.page()`** adds a page to the site. See [Pages and API routes](/plugins/pages-and-routes).
- **`defineAdmin()`** is the admin entry: admin screens, form actions, settings pages and admin
  slots. It runs after every plugin's `setup()`, and only where the admin is, so its components
  never reach the site's visitors. See [The admin entry](/plugins/admin#the-admin-entry).
- **`cms.slots.fill()`** renders a component in a slot, here the Dashboard's
  `admin.dashboard`. See [Slots](/plugins/slots).

## Installing it

In the site, add the package and list it in `cms.config.json`:

```bash
npm install @acme/plugin-greeting
```

```json filename="cms.config.json"
{
  "plugins": ["@acme/plugin-greeting"]
}
```

While you work on it, keep the plugin in a folder inside the site, such as `plugins/greeting`,
and install it from there: `npm install ./plugins/greeting`. Next.js compiles only what sits
inside the site's folder. A plugin with a repository of its own turns this around: the repository
holds the plugin and a [development site](/plugins/testing#a-development-site) that installs it.

Restart `npm run dev`; it runs `cms generate`, which finds the admin entry in the package's
`exports`. The plugin appears on **Plugins › Installed Plugins**, inactive; click
**Activate**. Open `/hello`, then the Dashboard. Change the message under **Settings › Greeting**
and both update.

## Next

- [Test it](/plugins/testing) with `@otwdesign/testing`.
- Learn the rest of [the plugin definition](/plugins/getting-started/plugin-definition).
- Hook into other plugins with [actions and filters](/plugins/hooks).
