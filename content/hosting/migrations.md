---
title: Database migrations
description: When the CMS and its plugins change the database, how to run the changes safely, and what happens until they've run.
order: 5
---

The CMS and its plugins change the database as they evolve: a new table, a new column. These
changes are **migrations**. Each runs once, is recorded in the `cms_migrations` table, and never
runs again. `CMS_MIGRATIONS` decides when they run.

## `startup`: when the site starts

The default, for a site on one server. Pending migrations run as the site starts, each in a
transaction, under a lock so two processes can't run the same one. Updates through `cms serve`
back up first.

Plain `next start` doesn't back up: run `cms migrate` yourself before starting a new version, as
below, to get a backup.

## `deploy`: in the deploy step

For several servers, containers or serverless, set `CMS_MIGRATIONS=deploy`. The site never
migrates while it runs; the deploy runs `cms migrate` once, before the new version takes traffic.

```bash
npx cms migrate            # back up, then migrate
npx cms migrate --dry-run  # list what would run, change nothing
npx cms migrate --no-backup  # when the host backs up for you
```

Until migrations have run:

- **A plugin with pending migrations stays off**, and administrators see **Database update
  required**, with an **Update database** button that runs them from the admin.
- **Pending core migrations stop the site from starting**, and the log names the command to run,
  because the CMS can't run without its own tables.

## Backups

`cms migrate` backs up before it changes anything: a copy of the embedded database's folder, or a
`pg_dump` file in `.data/backups/` for PostgreSQL. Without `pg_dump` on the server, it stops and
asks you to back up yourself, then run it with `--no-backup`. See
[Databases](/hosting/database#backups).

## If a migration fails

Each migration runs in a transaction, so a failing one changes nothing. A plugin's failing
migration leaves that plugin off, with the error on the Plugins screen; the rest of the site
runs. Fix the cause, often a plugin update, and the migration runs again on the next start or
`cms migrate`.
