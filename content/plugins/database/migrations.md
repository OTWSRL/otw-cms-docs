---
title: Migrations
description: Create and change a plugin's tables with migrations that run once, in a transaction, at startup or at deploy.
order: 1
---

A migration is a change to the database: creating a table, adding a column, filling a new
column from old data. A plugin lists its migrations in its definition; the CMS runs each one once,
in order, and records it so it never runs again.

```ts filename="src/migrations.ts"
import type { Migration } from '@otwdesign/sdk'
import { sql } from 'drizzle-orm'

export const migrations: Migration[] = [
  {
    id: '0001_courses',
    up: (db) =>
      db.execute(sql`
        CREATE TABLE lms_courses (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          slug text NOT NULL UNIQUE,
          title text NOT NULL,
          price integer NOT NULL CHECK (price >= 0),
          published boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `),
  },
  {
    id: '0002_enrolments',
    up: async (db) => {
      await db.execute(sql`
        CREATE TABLE lms_enrolments (
          email text NOT NULL,
          course_id uuid NOT NULL REFERENCES lms_courses (id) ON DELETE CASCADE,
          enrolled_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (email, course_id)
        )
      `)
      await db.execute(sql`CREATE INDEX lms_enrolments_course ON lms_enrolments (course_id)`)
    },
  },
]
```

Pass them to `definePlugin({ migrations })`.

## The rules

- **Ids are unique within the plugin** and never change. They run in array order, so number them.
- **Never change a migration that has shipped.** Sites that ran it won't run it again. Add a new
  one instead.
- **Migrations only move forward.** There are no down migrations. Rolling back a release keeps the
  database as it is, so write changes the previous version can live with: add columns and tables,
  backfill, and remove old ones in a later release, once nothing reads them.
- **Each migration runs in a transaction.** One that fails rolls back completely, and the plugin is
  left out with the error, rather than half-migrated.
- **Keep the schema and the migrations in step.** Drizzle doesn't create tables here: the
  migrations do, and the schema describes them for queries. Test your queries against the
  migrated database (see [Testing](/plugins/testing)) to catch the two drifting apart.

## When they run

The CMS records each plugin's applied migrations in its `cms_migrations` table. When migrations
run depends on the site's `CMS_MIGRATIONS` setting:

- **`startup`** (the default, for one server): when the site starts, for every active plugin,
  each under a database lock so two processes never run the same migration. Activating a plugin
  runs its migrations too.
- **`deploy`** (for several servers, or serverless): never while the site runs. The deploy step
  runs `cms migrate`, which backs up the database first. Until then, a plugin with pending
  migrations stays off, and administrators see **Database update required** with an
  **Update database** button.

See [Database migrations](/hosting/migrations) for how sites run them.
