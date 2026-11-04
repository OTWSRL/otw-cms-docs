---
title: Getting started
description: What you need to run OTW CMS, and the first steps from an empty folder to a working admin.
order: 1
---

Getting a site running takes three steps:

1. [Install it](/documentation/getting-started/installing): create the site with one command.
2. [Set it up](/documentation/getting-started/first-steps): the first visit to the admin creates
   the administrator account.
3. Find your way around [the admin](/documentation/the-admin).

## What you need

- **Node.js 22.18 or newer** on the computer or server that runs the site.
- **A package manager**: npm comes with Node.js; pnpm, Yarn and Bun work too.
- **A database**, for production only. Without one, the site uses an embedded database stored in a
  folder beside it, which is right for trying the CMS and for small sites on one server. For
  anything bigger, use PostgreSQL; see [Databases](/hosting/database).

You don't need to know Next.js to run a site, only to change how it looks or to write plugins.
