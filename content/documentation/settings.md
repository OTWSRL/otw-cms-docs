---
title: Settings
description: The site's own settings under Settings › General, Reading and Media, the settings plugins add, and settings fixed by the server.
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

**Send email from**, under Email, is who the site's email comes from, such as
`My Site <hello@example.com>`. Leave it empty to use the mail plugin's own sender. A site needs a
mail plugin to send email at all: without one, password resets and sign-ups can't reach anyone.

**Anyone can register**, under Membership, lets people sign up on the site at `/account`, as
Customers; see [Accounts on the site](/documentation/accounts). It's off until you tick it, and
needs a mail plugin.

Set **Site address** when the site runs behind a proxy or load balancer, or under more than one
address: it makes links in emails and from payment providers point at the right place. See
[Behind a reverse proxy](/hosting/reverse-proxy).

## Settings › Reading

As WordPress's: what the home page shows, and how long lists of posts are.

| Setting                     | What it does                                                                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Your homepage displays**  | **Your latest posts**, the default, or **A static page (choose below)**.                                                                                              |
| **Homepage**                | With a static page: the page to show at `/`. It must be published; until it is, the home page shows the latest posts.                                                 |
| **Posts page**              | With a static page: a page whose address lists the latest posts instead of its own content, under its title. Leave it empty if the site doesn't need a list of posts. |
| **Blog pages show at most** | How many posts each page of a list shows: the latest posts, a category's or a tag's, and plugins' lists such as courses. 1 to 100; 10 by default.                     |

Longer lists go on over more pages, at `?page=2` and so on. The pages chosen here are ordinary
pages: edit them under Pages, as any other. See
[Posts and pages on the site](/documentation/posts-and-pages#on-the-site).

A developer can give the site a home page of its own, and a plugin can put one at `/`; either
shows instead, and these settings don't change it. See
[Your own pages](/themes/pages#the-home-page).

## Settings › Media

As WordPress's: the sizes images are copied to when they're uploaded, in pixels.

| Setting                                                    | What it does                                                                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Thumbnail size**                                         | Width and height, 150 by 150. **Crop thumbnail to exact dimensions** cuts them square; otherwise they keep their shape. |
| **Medium size**                                            | The largest width and height, 300 by 300.                                                                               |
| **Large size**                                             | The largest width and height, 1024 by 1024.                                                                             |
| **Organize my uploads into month- and year-based folders** | Files go in `2026/11/` folders, as their addresses show. On by default.                                                 |

A 0 leaves that side free; 0 by 0 turns the size off. New sizes apply to images uploaded from then
on: images already in the library keep the copies they have.

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
