---
title: The database
description: Store a plugin's data in its own Postgres tables with Drizzle, write atomically with transactions, and share data through services.
order: 8
---

Every site has a PostgreSQL database: real PostgreSQL in production, or PGlite, PostgreSQL compiled
to WebAssembly and embedded in the site, when no database is configured. Both speak the same SQL,
so a plugin works the same on either.

`cms.db` is a [Drizzle](https://orm.drizzle.team) database. Use its query builder with a schema,
or `sql` for anything else.

## Tables

A plugin keeps its data in tables of its own, named with its id: `lms_courses`,
`lms_enrolments`. It creates them in [migrations](/plugins/database/migrations), and describes them
to Drizzle in a schema for typed queries:

```ts filename="src/schema.ts"
import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const courses = pgTable('lms_courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  price: integer('price').notNull(),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

```ts filename="src/queries.ts"
import type { PluginContext } from '@otwdesign/sdk'
import { and, asc, eq } from 'drizzle-orm'
import { courses } from './schema'

export function courseQueries(cms: PluginContext) {
  return {
    published: () =>
      cms.db.select().from(courses).where(eq(courses.published, true)).orderBy(asc(courses.title)),

    async bySlug(slug: string) {
      const [course] = await cms.db
        .select()
        .from(courses)
        .where(and(eq(courses.slug, slug), eq(courses.published, true)))
        .limit(1)
      return course ?? null
    },

    publish: (id: string) =>
      cms.db.update(courses).set({ published: true }).where(eq(courses.id, id)).returning(),
  }
}
```

## Transactions

`cms.transaction(fn)` runs `fn` in a transaction. Inside it, `cms.db` _is_ the transaction, for
your code and for any plugin your code calls: services, and the handlers of the actions you fire.
So everything that happens because of one change commits together, or not at all.

```ts filename="src/enrol.ts"
import type { PluginContext } from '@otwdesign/sdk'
import { sql } from 'drizzle-orm'

declare module '@otwdesign/sdk' {
  interface Actions {
    /** A learner was enrolled in a course. */
    'lms.enrolled': { email: string; courseId: string }
  }
}

export function enrol(cms: PluginContext, email: string, courseId: string) {
  return cms.transaction(async () => {
    await cms.db.execute(
      sql`INSERT INTO lms_enrolments (email, course_id) VALUES (${email}, ${courseId})`,
    )
    // Handlers write through cms.db too, so their writes are part of this transaction.
    await cms.hooks.doAction('lms.enrolled', { email, courseId })
  })
}
```

- A transaction inside another becomes a **savepoint**.
- **Read `cms.db` when you use it.** It changes with the transaction you're in, so a copy saved
  during `setup()` would write outside it.
- Keep transactions short. Call slow services, such as payment providers or email, after the
  commit, as Commerce does when it starts a payment.

## Other plugins' data

Don't query another plugin's tables. They aren't its API, and they change between releases. Use
its [service](/plugins/registries-and-services#services) instead.

Foreign keys follow the same rule. Point them at core's tables and at the tables of plugins you
_require_, which can't be deactivated while yours is active. For plugins you only use
_optionally_, keep the ids in your own tables without a foreign key.

## Deactivating and removing

Deactivating a plugin keeps its tables and data, so activating it again picks up where it left
off. Removing a plugin's data when it's uninstalled isn't supported yet.
