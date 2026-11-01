---
title: Hosting
description: Run an OTW CMS site in production. Choose a database and a host, run migrations safely, and keep the site updated.
---

An OTW CMS site is a Next.js app with a database, so it runs wherever Next.js does. What changes
between hosts is how the database is reached, how migrations run, and how updates arrive.

## Choosing how to host

| Hosting                                                       | Database               | Updates                                | Good for                          |
| ------------------------------------------------------------- | ---------------------- | -------------------------------------- | --------------------------------- |
| [Your own server, with `cms serve`](/hosting/your-own-server) | Embedded or PostgreSQL | From the admin, as in WordPress        | Most single sites; agencies' VPSs |
| [Docker](/hosting/docker)                                     | Embedded or PostgreSQL | Rebuild the image                      | Container platforms               |
| [Vercel and other serverless hosts](/hosting/serverless)      | PostgreSQL             | A pull request, started from the admin | Teams that deploy from git        |

## What every site needs

- **Node.js 24 or newer.**
- **A database.** The embedded one (PGlite, in a folder beside the site) suits one server. For
  several servers or serverless, use PostgreSQL. See [Databases](/hosting/database).
- **HTTPS**, in front of the site. Session cookies are marked `Secure` on HTTPS.
- **Its settings**, in environment variables or a `.env` file. See
  [Environment variables](/hosting/environment-variables).

## Before a site goes live

1. Open `/admin` and create the administrator before anyone else can. See
   [First steps](/documentation/getting-started/first-steps).
2. Set the site's address, `SITE_URL`, or `CMS_TRUST_PROXY=1` behind a proxy. See
   [Behind a reverse proxy](/hosting/reverse-proxy).
3. Set up backups of the database. See [Databases](/hosting/database#backups).
4. Read [Security](/hosting/security).
