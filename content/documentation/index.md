---
title: Documentation
description: Run a site with OTW CMS. Install it, find your way around the admin, manage plugins, users and settings, and keep it up to date.
---

OTW CMS is a content management system built on [Next.js](https://nextjs.org). It works the way
WordPress does: a site gets its features from **plugins**, people sign in to an **admin** to manage
it, and what each person may do depends on their **role**. If you have run a WordPress site, most of
the admin will look familiar.

This handbook is for the people who run a site: owners, editors and shop managers. Developers who
want to extend the CMS should read the [Plugin Handbook](/plugins), and the
[Theme Handbook](/themes) explains how a site looks. [Hosting](/hosting) covers servers,
databases and deployment.

## What you can do

- **Install a site** in a few minutes, with or without plugins. See
  [Installing OTW CMS](/documentation/getting-started/installing).
- **Manage plugins** on the Plugins screen: switch them on and off without rebuilding the site.
  See [Managing plugins](/documentation/plugins).
- **Add people** and give each a role, such as Administrator or Shop manager. See
  [Users and roles](/documentation/users-and-roles).
- **Change settings** for the site and for each plugin. See [Settings](/documentation/settings).
- **Update** the CMS and its plugins from the admin, where your hosting allows it. See
  [Updating](/documentation/updates).
- **Rename the CMS** in the admin for your clients. See [White label](/documentation/white-label).

## How a site is put together

A site is a small Next.js app. The CMS and its plugins are packages the site depends on, so
**installing** a plugin means adding its package and rebuilding the site, which is a developer's
job. **Activating** a plugin, once it's installed, is a switch in the admin that anyone with the right
role can flip, with no rebuild.

The site stores its content and settings in a database: an embedded one that needs no setup, or
PostgreSQL for production. The admin lives at `/admin` on the same address as the site.
