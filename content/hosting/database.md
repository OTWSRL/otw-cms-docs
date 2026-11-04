---
title: Databases
description: The embedded database and PostgreSQL. When to use each, how to connect, where data lives, and how to back it up.
order: 1
---

OTW CMS stores everything in PostgreSQL. It can use a PostgreSQL server, or PGlite, PostgreSQL
compiled to WebAssembly and embedded in the site. Both run the same SQL, so plugins behave the
same on either.

## The embedded database

Without `DATABASE_URL`, the site keeps its database in a folder: `.data/pglite` beside the site,
or wherever `CMS_DATA_DIR` points. There's nothing to install or configure.

- **One process at a time.** The embedded database belongs to the process that opened it; a lock
  file stops a second server, or `cms migrate` beside a running site. So it suits a site on one
  server, not several. The lock records its process's id and when it started, so a container
  that restarts, and hands the same ids out again, takes it over rather than finding it held.
- **It looks after itself.** A PostgreSQL server's autovacuum keeps the statistics its query
  planner relies on, and clears out old row versions. The embedded database runs no background
  processes, so the site's server does the same: 30 seconds after it starts, then every five
  minutes, it analyzes and vacuums the tables that changed enough, by autovacuum's rules.
- **Keep the folder.** It _is_ the database. In containers, put it on a volume.
- **Not on serverless hosts**, whose file systems don't last between requests.

### Memory

The embedded database runs inside the site's server process. In a container, a small site's
server used about 210 MB with it, against about 70 MB with PostgreSQL.

- **Its cache** is 16 MB, set by [`CMS_SHARED_BUFFERS`](/hosting/environment-variables#cms_shared_buffers),
  which suits a site whose database fits in it. In a 130 MB database, finding one entry was as
  fast as with PostgreSQL's default of 128 MB, but scanning a long list or counting entries took
  about three times as long. A large embedded database can raise it, or move to PostgreSQL.
- **Creating the database** takes about 700 MB for a moment. The site does it in a short-lived
  process of its own on its first start, so the server doesn't keep that memory.

## PostgreSQL

Set `DATABASE_URL` to a connection string, and the site uses that server:

```dotenv
DATABASE_URL=postgres://cms:secret@db.example.com:5432/cms
```

Use PostgreSQL when the site runs on several servers or serverless, when you want the host's
managed backups, or when the database outgrows one machine. Any current PostgreSQL works,
including managed ones such as Neon, Supabase, RDS or Cloud SQL.

## Backups

`cms migrate` backs up the database before it changes anything:

- **Embedded**: a copy of the database folder, beside it in `backups/`.
- **PostgreSQL**: a `pg_dump` file in the site's `.data/backups/`. This needs `pg_dump` on the
  server; where the host backs up for you (most managed PostgreSQL does), run
  `cms migrate --no-backup` instead.

Updates made with `cms serve` back up before they migrate too: PostgreSQL to the same
`.data/backups/`, and the embedded database to `.cms/backups/`, which keeps the newest three. These backups are a safety
net for updates. Keep regular backups as well: snapshot the embedded folder while the site is
stopped, or use your PostgreSQL host's backups.

## Moving from embedded to PostgreSQL

There's no built-in way to move a site's data from the embedded database to PostgreSQL yet. Choose
PostgreSQL from the start for a site that will need it.
