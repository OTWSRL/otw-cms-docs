---
title: Database
description: Browse, query and edit the site's database, and any other you connect, from the admin, the way TablePlus does.
order: 8.2
---

The **Database** plugin puts a database manager in the admin: the site's own database, and any
other PostgreSQL, MySQL, MariaDB or SQLite database you connect, browsed, queried and edited the
way TablePlus does. It's WordPress's phpMyAdmin, in a desktop app's clothes.

## Installing it

```bash
npm install @otwdesign/plugin-db
```

Add `"@otwdesign/plugin-db"` to `cms.config.json`, rebuild, and activate **Database** on the Plugins
screen. A new site can start with it: `npm create otw-cms@latest my-site -- --plugins @otwdesign/plugin-db`.

Database shows in the admin's menu to administrators: it takes the **Manage databases**
capability (`db.manage`), which administrators have. Give it to another role on
[Users and roles](/documentation/users-and-roles) only if that role may read everything in the
site's database, password hashes included.

The plugin costs a site nothing until someone opens it: at boot it registers four routes, and the
tool loads on the first request to it.

## The site's database

**This site** is always the first connection. It's read-only: the screen browses and queries, and
the database refuses anything that would change it. To edit the site's database from here, set
`DB_ADMIN_SITE_ACCESS=write`; see [Environment variables](/hosting/environment-variables#plugins).

> [!WARNING]
> A site without `DATABASE_URL` keeps its database inside the site's own process (the embedded
> database). A heavy statement run on it holds the whole site until it finishes, and nothing can
> stop it early: the screen says so wherever you run SQL on it. Browsing, paging and filtering
> run small queries and are safe.

A site on PostgreSQL (`DATABASE_URL`) has none of that: statements there have a time limit and a
**Cancel** button, as on any other connection.

## Other databases

Each `DB_ADMIN_<NAME>_URL` adds a connection, read-only unless its `_ACCESS` says `write`:

```dotenv
DB_ADMIN_SHOP_URL=postgres://reader:secret@db.example.com:5432/shop
DB_ADMIN_SHOP_LABEL=Shop
DB_ADMIN_SHOP_TAG=production
DB_ADMIN_LOCAL_URL=sqlite:./data/local.db
DB_ADMIN_LOCAL_ACCESS=write
```

| Address                           | Database               | Install  |
| --------------------------------- | ---------------------- | -------- |
| `postgres://…` or `postgresql://` | PostgreSQL, Neon, etc. | nothing  |
| `mysql://…` or `mariadb://…`      | MySQL and MariaDB      | `mysql2` |
| `sqlite:/path/to/file.db`         | SQLite (a file)        | nothing  |

The tag (`local`, `development`, `testing`, `staging` or `production`) colors the connection, and
`production` asks before running anything that may change it. A read-only connection is the tool's
guard; the database's own permissions are the real one, so give read-only connections a role that
may only read.

## Working in it

- **Tables:** the sidebar lists the schema's tables, views and materialized views, with their row
  counts.
  A table opens in a tab: a page of rows at a time, sorted by a header, filtered with the filter
  bar, and counted exactly on **Count**. **Structure** shows its columns, indexes, foreign keys and
  checks. The panel on the right shows the selected row whole.
- **Editing**, on a connection that may write and in a table with a primary key: double-click a
  cell, or select it and type; **+ Row** adds a row; **Delete** marks the selected one. Changes
  show in color until **⌘S**, which shows the SQL that will run and commits it in one transaction:
  all of it, or none, and none when someone changed one of the rows in the meantime. **⌘Z** steps
  back; **Discard** drops them all.
- **SQL editor:** **⌘E** opens one. **⌘↵** runs the statement at the cursor, **⇧⌘↵** runs them all,
  each with its result. Errors point at their line and column. History keeps what you ran.
- **Export:** a table, as filtered and sorted, as CSV, JSON or SQL; a query's result as CSV or JSON.

Every statement run goes to the server's log with who ran it.

| Shortcut | Does                                                  |
| -------- | ----------------------------------------------------- |
| ⌘P       | Open a table by name                                  |
| ⌘E       | New SQL editor                                        |
| ⌘R       | Refresh                                               |
| ⌘F       | Filter the table                                      |
| ⌘S       | Review and commit the changes                         |
| ⌥W       | Close the tab (the browser keeps ⌘W for its own tabs) |
| ⌘[ ⌘]    | Previous and next tab                                 |

On Windows and Linux, Ctrl stands for ⌘.

## Outside the CMS

The same tool runs in any Next.js or Node app, or on its own with
`npx @otwdesign/db`. See [OTW DB](https://github.com/OTWSRL/otw-db#readme).
