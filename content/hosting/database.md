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
  A lock from 1.0, which has no start time, is taken over when the process with its id started
  after the lock was written: a site upgrading from 1.0 into a new container starts as usual.
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

### Connections

Each server, and each serverless instance, keeps a pool of up to 10 connections, and closes one
that stays unused for 10 seconds. Many instances at once can reach the database's limit, so the
site connects through a transaction pooler where there is one. A transaction pooler shares a few
database connections among many clients, one transaction at a time. The site keeps nothing on a
connection between transactions (its locks last one transaction), so it works there unchanged.

- **Supabase:** copy either pooler connection string. On the pooler's host, the site connects in
  transaction mode, port `6543`, even when `DATABASE_URL` says session mode's `5432`. Session mode
  admits only as many clients as its pool size, such as 15, and then fails with "max clients
  reached". [`CMS_DB_POOL_MODE=session`](/hosting/environment-variables#cms_db_pool_mode) keeps
  session mode, for a plugin that needs it. Backups use session mode, as `pg_dump` needs one
  session. The direct connection, `db.<project>.supabase.co`, is used as it is: it's IPv6 only
  without Supabase's IPv4 add-on, and many serverless hosts can't reach IPv6.
- **Neon:** use the pooled connection string, whose host ends in `-pooler`. Neon's dashboard gives
  it by default.
- **Elsewhere:** point `DATABASE_URL` at the host's transaction pooler, or at PgBouncer you run with
  `pool_mode = transaction`. A single long-running server can connect directly.
- **Size the pool** with [`CMS_DB_POOL_MAX`](/hosting/environment-variables#cms_db_pool_max) and
  [`CMS_DB_POOL_IDLE_MS`](/hosting/environment-variables#cms_db_pool_idle_ms). Connecting
  directly, or through a session pooler, keep instances × `CMS_DB_POOL_MAX` under the database's
  limit.

`pg`, which the site connects with, reads `sslmode=require` as "verify the certificate fully".
Supabase's is signed by Supabase's own authority, so that fails. Add `uselibpqcompat=true`, and
`require` means what it means to `psql`: encrypted, without checking who signed the certificate.
To check it too, add `sslrootcert=` with the path to Supabase's CA certificate. Backups leave
`uselibpqcompat` out, as `pg_dump` doesn't know it and already reads `require` that way.

```dotenv
DATABASE_URL=postgres://postgres.abcd:secret@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?uselibpqcompat=true&sslmode=require
```

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
