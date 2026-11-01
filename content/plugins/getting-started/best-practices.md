---
title: Best practices
description: The rules that keep plugins working together. Namespace everything, own your tables, use services instead of other plugins' tables, and keep setup() quick.
order: 4
---

Many plugins share one site, one database and one admin. These rules keep them out of each
other's way. The CMS enforces some of them; the rest are what makes a plugin a good neighbour.

## Namespace everything with your id

Everything a plugin names starts with its id: settings (`events.date_format`), hooks
(`events.event.published`), registries, capabilities (`events.manage_events`), slots, and
database tables (`events_*`). The CMS refuses settings outside the namespace; for the rest, it's
what keeps two plugins from colliding.

## Own your tables

- **Create and change only your own tables**, in your [migrations](/plugins/database/migrations).
- **Foreign keys** may point at core's tables and at the tables of plugins you _require_. A
  plugin you only use _optionally_ can be deactivated or removed, so keep links to it in your own
  tables without a foreign key.
- **Read other plugins' data through their services**, never their tables: the service is their
  promise to you, the tables aren't. See [Services](/plugins/registries-and-services#services).

## Read the database when you use it

`cms.db` is the current transaction when your code runs inside one, and the main connection
otherwise. Read it at the moment you query, never save it in a variable during `setup()`, or
your writes escape the transaction that's meant to hold them. See
[Transactions](/plugins/database#transactions).

## Keep setup() quick

`setup()` runs on every start and every time an administrator activates a plugin or saves
settings. Register things there; don't query the database, call other servers, or write files.
Do that work when a request needs it.

## Expose extension points

If other plugins might want to change what yours does, give them a hook, a registry or a slot,
declared with types. That's how Stripe extends Commerce without Commerce knowing about it. See
[Your own extension points](/plugins/hooks/extension-points).

## Let errors say what to do

- In admin actions, throw `ActionError` with a sentence the user can act on: "That slug is
  taken." Anything else is logged and shown as a generic error.
- When a check needs the loaded object, throw `ForbiddenError`; it answers 403.
- From API routes, throw `HttpError` with a status for errors the caller should see.

## Escape nothing, validate everything

React escapes what your components render, so don't build HTML strings, and avoid
`dangerouslySetInnerHTML`. Validate every value that comes in: form fields, query strings,
request bodies and webhook payloads. See [Security](/plugins/security).
