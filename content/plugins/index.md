---
title: Plugin Handbook
description: Build plugins for OTW CMS. Add pages, admin screens, settings, roles and hooks, and extend other plugins the way WooCommerce extensions extend WooCommerce.
---

Plugins are how OTW CMS grows. Everything beyond the admin's own screens is a plugin, including
the CMS's shop: products, checkout, orders, and an extension point for every payment method.
This handbook shows how to write one.

## What a plugin can do

A plugin is an npm package that exports a definition. In its `setup(cms)` it can:

- **Add pages to the site** and **API endpoints** for forms, webhooks and scripts. See
  [Pages and API routes](/plugins/pages-and-routes).
- **Add admin screens**, menu entries, forms and settings pages, built from WordPress's own
  markup. See [Admin screens](/plugins/admin).
- **Declare settings** that the admin edits and the environment can override. See
  [Settings](/plugins/admin/settings).
- **Add roles and capabilities**, and decide who may act on what. See
  [Roles and capabilities](/plugins/users-and-capabilities).
- **Store data** in its own tables, with migrations. See [The database](/plugins/database).
- **Extend other plugins** through their hooks, registries, services and slots, and **be
  extended** through its own. See [Hooks](/plugins/hooks).

## How it differs from WordPress

The ideas are WordPress's: actions and filters, roles and capabilities, admin pages, settings
pages, activation. The details change where TypeScript and Next.js do better:

- **Everything is typed.** A plugin declares its hooks, settings and capabilities on
  `@otw/sdk`'s interfaces, so another plugin that hooks in gets autocompletion and type errors
  instead of typos found in production.
- **Dependencies are enforced.** A plugin says which plugins and which versions it needs; the CMS
  loads them first and won't activate it without them.
- **Nothing is stored that the code can rebuild.** Roles and capabilities come from the active
  plugins on every boot, so deactivating a plugin removes what it added.
- **Output is escaped by React.** You write components, not HTML strings.
- **A broken plugin can't take the site down.** A plugin that throws while starting is left out,
  with the reason shown on the Plugins screen.

## Where to start

1. [Your first plugin](/plugins/getting-started) takes ten minutes.
2. [The plugin definition](/plugins/getting-started/plugin-definition) explains every field.
3. [Hooks](/plugins/hooks) is the heart of extending the CMS and other plugins.

The [Code Reference](/reference) lists every extension point and every function, read from the
source.
