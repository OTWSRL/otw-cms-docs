---
title: The admin
description: A tour of the admin at /admin. The admin bar, the menu, the Dashboard, notices, and how it works on phones and tablets.
order: 2
---

The admin is where a site is run. It lives at `/admin` and looks like WordPress's: a black bar
across the top, a menu down the left, and the screen you're on in the middle.

## The admin bar

The bar along the top shows the site's name, which links to the site itself, so you can check
your changes. On the right, **Howdy, _your name_** opens your account menu, with your email and
**Log Out**.

When a screen takes more than a moment to open, a thin line runs along the top of the bar until
it's there, so you know your click worked.

## The menu

The menu lists what you may use, and nothing else: a shop manager sees the shop's screens but not
Plugins or Users. Its sections come in this order:

- **Dashboard**, with **Home** and **Updates**.
- **Posts**, **Media** and **Pages**: the site's content and its files. See
  [The media library](/documentation/media).
- **One section for each active plugin**, with the plugin's icon, in the order plugins load.
  Commerce, for example, adds Products and Orders.
- **Plugins**, **Users** and **Settings**.

A plugin can also put a page in another section: settings pages usually sit under Settings, for
example. Hover over a section, or tap it on a touch screen, to see its pages. **Collapse Menu** at
the bottom folds the menu down to icons; the admin remembers your choice.

A number beside **Dashboard**, **Updates** or **Plugins** counts the updates that are waiting.

## The Dashboard

The Dashboard is the first screen after you sign in.

- **At a Glance** shows how many plugins are active and which version of the CMS the site runs.
- **Widgets** from plugins follow it: a shop's recent orders, for example.
- **Problems** show at the top for people who manage plugins: a plugin that failed to load, with
  the reason, and any warnings.

## Notices

After you save or change something, a message at the top of the screen says what happened, such
as "Settings saved." It shows once; close it with the × or leave the screen. When something
can't be done, the message says why, on the screen you were on, so you can correct it.

Plugins add notices of their own: Stripe, for example, says when its keys aren't set yet. And when
a plugin needs its database updated before it can run, people who manage plugins see
**Database update required** with an **Update database** button. Take a backup first; see
[Database migrations](/hosting/migrations).

## On phones and tablets

The admin works at any width, as WordPress's does:

- **Below 960 pixels** the menu folds down to icons; tap one to open its pages.
- **Below 783 pixels**, on phones, the menu hides behind the button at the left of the admin bar.
  Lists show one column, with a toggle on each row for the rest, and forms stack their labels
  above their fields.

## Who can see what

Each screen needs a **capability**, and roles grant capabilities. Administrators have all of them.
A screen you can't use is missing from your menu, and opening it directly says "Sorry, you are not
allowed to access this page." See [Users and roles](/documentation/users-and-roles).
