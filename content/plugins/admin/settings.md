---
title: Settings
description: Declare typed settings, let the environment override them, keep secrets out of the database, and place fields on settings pages, your own or other plugins'.
order: 3
---

Settings work as WordPress's Settings API does, with types. A plugin **declares** its settings in
its definition, so the CMS knows them before `setup()` runs, and **places** them on settings pages
in `setup()`. The admin draws the forms, validates and saves them. Your code only reads values.

## Declaring settings

Each setting has a key starting with the plugin's id, a type on the `Settings` interface, and a
field in the definition's `settings`:

```ts filename="src/settings.ts"
import type { PluginContext, SettingDefinitions } from '@otwdesign/sdk'

declare module '@otwdesign/sdk' {
  interface Settings {
    /** Show the newest announcement in a bar on every page. */
    'announcements.bar': boolean
    /** Where the bar sits: `top` or `bottom`. */
    'announcements.position': string
    /** A URL that's told about every new announcement. Empty for none. */
    'announcements.webhookUrl': string
    /** Signs the requests sent to the webhook. */
    'announcements.webhookSecret': string
  }
}

export const settings: SettingDefinitions = {
  'announcements.bar': { type: 'boolean', label: 'Show the announcement bar', default: true },
  'announcements.position': {
    type: 'select',
    label: 'Position',
    options: [
      { value: 'top', label: 'Top of the page' },
      { value: 'bottom', label: 'Bottom of the page' },
    ],
    default: 'top',
  },
  'announcements.webhookUrl': {
    type: 'text',
    label: 'Webhook URL',
    description: 'Receives a POST for every new announcement.',
    env: 'ANNOUNCEMENTS_WEBHOOK_URL',
    validate: (value) =>
      value === '' || value.startsWith('https://') ? null : 'Use an https:// address',
  },
  'announcements.webhookSecret': {
    type: 'secret',
    label: 'Webhook secret',
    env: 'ANNOUNCEMENTS_WEBHOOK_SECRET',
  },
}

export function registerSettings(cms: PluginContext) {
  cms.admin.settingsPage({
    name: 'settings',
    path: '/settings',
    title: 'Announcement settings',
    capability: 'core.manage_settings',
    menu: { label: 'Announcements' },
  })
  cms.admin.settingsSection({
    name: 'bar',
    page: 'announcements.settings',
    title: 'Announcement bar',
    fields: ['announcements.bar', 'announcements.position'],
  })
  cms.admin.settingsSection({
    name: 'webhook',
    page: 'announcements.settings',
    title: 'Webhook',
    description: 'Tell another system when an announcement is published.',
    fields: ['announcements.webhookUrl', 'announcements.webhookSecret'],
  })
}
```

The plugin passes `settings` to `definePlugin()`, so every part of the site can read them, and
calls `registerSettings(cms)` in its [admin entry](/plugins/admin#the-admin-entry): settings pages
are part of the admin.

### Field types

| `type`    | The field               | Value     | Options                                                 |
| --------- | ----------------------- | --------- | ------------------------------------------------------- |
| `text`    | A line of text, trimmed | `string`  | `default`, `maxLength` (500 unless set), `validate`     |
| `boolean` | A checkbox              | `boolean` | `default`                                               |
| `select`  | A choice from `options` | `string`  | `options`, `default` (one of the options)               |
| `secret`  | Never shown or stored   | `string`  | `env`, required: secrets only come from the environment |
| `entry`   | A dropdown of entries   | `string`  | `contentType`, required: whose published entries, by id |

Every type takes `label`, `description` and `env`. `validate` returns an error message to refuse a
value, or `null` to accept it. The admin then saves nothing and says why at the top of the page,
after the field's label: "Webhook URL: Use an https:// address."

## Reading settings

```ts
const position = cms.settings.get('announcements.position') ?? 'top'
```

`cms.settings.get()` returns the value, already resolved, typed from the `Settings` interface, or
`undefined` when it has none and no default. Any plugin can read any setting. Read it where you use
it: when an administrator saves settings, the CMS starts again with the new values.

A value comes from the first of these that has one:

1. **Code**: values given to the kernel directly, as tests do.
2. **The environment**, when the field names an `env` variable that's set. The admin shows the
   field read-only: "Set by the `ANNOUNCEMENTS_WEBHOOK_URL` environment variable."
3. **The database**, saved from the admin.
4. **The default.**

A stored or environment value that's no longer valid (an option that was removed, say) is skipped
with a warning on the Dashboard, rather than breaking the site.

### Secrets

`secret` fields hold API keys and signing secrets. They come only from the environment, are never
written to the database, and the admin only says **Configured** or **Not set**. Never log them.

## Settings pages

Fields go on pages, in sections, as with WordPress's `add_settings_section()` and
`add_settings_field()`:

- **`cms.admin.settingsPage()`** adds a page, listed under **Settings** by default. Its
  `capability` decides who may open and save it; it defaults to `core.manage_settings`. Commerce
  gives its pages `commerce.manage_settings`, so shop managers can change the shop's settings but
  not the site's.
- **`cms.admin.settingsSection()`** adds a section to any page, by its qualified name: your own
  (`announcements.settings`), core's (`core.general`), or another plugin's (`commerce.payments`).
  Stripe adds its section to Commerce's Payments page this way.
- **`cms.admin.settingsFields()`** adds fields to another plugin's section, such as core's Site
  section: `cms.admin.settingsFields({ section: 'core.site', fields: ['seo.tagline'] })`.

A plugin places only its own settings, each once. If a page or section it names belongs to a
plugin that isn't active, the fields move to the plugin's own settings page, so an optional
integration's settings never disappear. Fields a plugin doesn't place at all get a page of their
own under Settings, named after the plugin.

## Saving

The admin saves a page's fields together: it validates each, and if any is invalid, saves none
and names the field.
Before saving, it starts the plugins that read a changed setting during `setup()` with the new
values. If one of them can't start, nothing is saved and the page says why, so a bad value can't
take the site down. Plugins that only read settings later, while handling a request, aren't
started: a save costs what it touches.
