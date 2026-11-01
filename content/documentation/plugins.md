---
title: Managing plugins
description: Activate and deactivate plugins on the Plugins screen, see why one can't be switched, install new ones, and recover from a plugin that fails.
order: 3
---

Plugins add a site's features: a shop, payment methods, courses, forums. **Plugins › Installed
Plugins** lists every plugin installed on the site, active ones highlighted, and lets people with
the **Activate and deactivate plugins** capability (`core.manage_plugins`) switch them on and off.

## Activating and deactivating

Click **Activate** or **Deactivate** under a plugin's name. The change applies at once: there's
no rebuild, and the next page you open already has the plugin on or off. On a brand new site,
every installed plugin starts active; plugins installed later start inactive.

Deactivating a plugin hides its screens, pages and features, but keeps its data. Activate it
again and everything is back.

The filters above the list show **All**, **Active** and **Inactive** plugins, and **Failed to
load** when there are any.

## When a plugin can't be switched

Plugins can depend on each other: Stripe needs Commerce, for example. So:

- A plugin can't be **activated** until the plugins it needs are active.
- A plugin can't be **deactivated** while an active plugin needs it.

The button is greyed out, and the reason is written under the plugin, such as "Stripe requires
it." Deactivate the plugins that need it first, or activate what it needs.

## When a plugin fails

Activating a plugin first tries the site with it switched on. A plugin that crashes while
starting stays off, and the screen says why, so a broken plugin can't take the site down.

If a plugin that was working starts failing (after an update, for example), the site carries on
without it and without the plugins that need it. It shows under **Failed to load**, marked
"Switched on, but not loaded", with the error. The Dashboard shows the problem too. Update the
plugin, or deactivate it until it's fixed.

## Installing a plugin

Installing adds the plugin's code to the site, so it's a job for whoever builds and deploys the
site:

1. Add the plugin's package: `npm install @acme/forum`.
2. Add its name to `"plugins"` in `cms.config.json`.
3. Rebuild and redeploy the site.

The plugin then appears on the Plugins screen, inactive. Adding plugins from the admin, as
WordPress's **Add New** does, needs a plugin directory, which doesn't exist yet.

```json filename="cms.config.json"
{
  "plugins": ["@otw/plugin-commerce", "@otw/plugin-commerce-stripe", "@acme/forum"]
}
```

## Updates

When a newer version of a plugin is out and the site can update itself, the plugin's row says
"There is a new version of _Name_ available", with **Update now**. See
[Updating](/documentation/updates).

## Plugins set by the server

A developer can fix which plugins are active with the `CMS_ACTIVE_PLUGINS` environment variable,
for sites that must not change. The Plugins screen then says so, and its buttons are off. See
[Environment variables](/hosting/environment-variables#cms_active_plugins).
