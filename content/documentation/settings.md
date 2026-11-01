---
title: Settings
description: The site's own settings under Settings › General, the settings plugins add, and settings fixed by the server.
order: 5
---

The **Settings** menu holds the site's settings and every plugin's. Each settings page has the
capability it needs: Settings › General needs **Change settings** (`core.manage_settings`), while a
shop manager can open the shop's pages but not the site's.

## Settings › General

| Setting          | What it does                                                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Site title**   | The site's name, in browser tabs, the admin bar and wherever the design prints it. Up to 100 characters. A new site is called "My Site".                                                |
| **Site address** | The site's public address, such as `https://example.com`, for links that leave the site: payment pages send buyers back to it. Leave it empty to use the address each visit arrives on. |
| **Locale**       | How numbers and prices are formatted, such as `en-US` or `de-DE`. Defaults to `en-US`.                                                                                                  |

Set **Site address** when the site runs behind a proxy or load balancer, or under more than one
address: it makes links in emails and from payment providers point at the right place. See
[Behind a reverse proxy](/hosting/reverse-proxy).

## Settings from plugins

Plugins add their own pages under Settings, and sections to other plugins' pages. Commerce adds:

- **Settings › Shop**, with the store's **Currency** (a three-letter code such as `USD`; changing
  it doesn't convert existing prices).
- **Settings › Payments**, with **Pay later** (bank transfer or cash on delivery). Payment plugins
  add their sections here: Stripe adds whether to offer cards, and whether its keys are set.

When you save a page, only the settings on that page change. If a value isn't valid, nothing is
saved, and the message at the top of the page names the setting and says why.

## Settings fixed by the server

A developer can set some settings in the site's environment instead, so they can't be changed by
mistake, or differ between a staging and a live site. The field then shows its value read-only,
with "Set by the `SITE_URL` environment variable", as WordPress shows constants from
`wp-config.php`.

**Secrets**, such as payment keys, only ever come from the environment: they're never stored in
the database or shown. Their fields say **Configured** or **Not set**. See
[Environment variables](/hosting/environment-variables).
