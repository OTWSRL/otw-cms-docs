---
title: First steps
description: Create the administrator account, sign in, and give the site its name.
order: 2
---

## Creating the administrator

The first time anyone opens `/admin`, the CMS shows **Welcome**, a form for the first account. It
belongs to the administrator, who can do everything, so use your own details:

- **Name**: how the admin greets you (optional).
- **Email**: what you sign in with.
- **Password**: at least 10 characters.

Click **Create administrator** and you're signed in, on the Dashboard, with the message
"Your site is ready." The form never shows again: once an account exists, `/admin/setup` sends
visitors to sign in instead.

> [!IMPORTANT]
> Whoever reaches the admin first creates the administrator. Do this as soon as a new site is
> online, before you share its address.

## Signing in and out

The sign-in screen is at `/admin/login`. Signing in takes you to where you were going, or to the
Dashboard. To sign out, open the menu with your name at the top right of the admin and choose
**Log Out**.

People without access to the admin, such as customers of a shop, can't open its screens: they see
"Sorry, you are not allowed to access this page." See [Users and roles](/documentation/users-and-roles).

## Naming the site

A new site is called "My Site". Change it under **Settings › General**, in **Site title**. The
name shows in the admin bar, in browser tabs, and wherever the site's design prints it. The same
screen sets the site's address and locale; see [Settings](/documentation/settings).

## Next

- Take [a tour of the admin](/documentation/the-admin).
- Switch on the plugins you need on the [Plugins screen](/documentation/plugins).
- [Add people](/documentation/users-and-roles) who will help run the site.
