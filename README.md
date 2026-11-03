# OTW CMS Documentation

The documentation site for OTW CMS, like wordpress.org's: a user guide, the Plugin and Theme
Handbooks, hosting, and a Code Reference read from the CMS's source. It runs on OTW CMS itself,
with no plugins.

```sh
pnpm install
pnpm dev            # http://localhost:3000; the CMS's admin is at /admin
pnpm check          # lint, format, typecheck, and the tests below
pnpm test:e2e       # Playwright against a production build, desktop and phone
```

## Where things are

```
content/documentation   the user guide: installing, the admin, plugins, users, settings, updates
content/plugins         the Plugin Handbook
content/themes          the Theme Handbook
content/hosting         hosting, databases, migrations, updates, environment variables
scripts/reference       the Code Reference generator (TypeScript compiler API)
src/docs                Markdown rendering, the handbooks' loader, search, the reference's pages
src/app/(site)          the site's routes: home, one route per handbook, /reference, /search
test, e2e               unit tests and Playwright tests
```

## Writing a page

A page is a Markdown file with front matter:

```md
---
title: Filters
description: One sentence, shown under the title, in search results and as the meta description.
order: 2
---
```

- **Chapters are folders.** `content/plugins/hooks/index.md` is the Hooks chapter's page, and the
  other files in `hooks/` sit under it. `order` sorts siblings (lowest first, then by title).
- **Links** use paths from the site root: `[Hooks](/plugins/hooks#priority)`.
- **Inline code** that names something in the reference links to it by itself: `` `definePlugin` ``,
  `` `commerce.order.paid` ``, `` `cms update` ``.
- **Notices**: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]` or `> [!WARNING]`.
- **Whole files** get a caption with `filename`: ` ```ts filename="src/index.ts" `. These are
  compiled, so they must be complete and correct.

Raw HTML in Markdown is dropped, so everything on a page is escaped.

## The Code Reference

`scripts/build-reference.ts` runs before `dev`, `build` and `typecheck`. It reads the installed
`@otwdesign/*` packages' source (they ship TypeScript) and writes `src/docs/reference.generated.json`:

- every extension point plugins declare on `@otwdesign/sdk` (actions, filters, slots, registries,
  services, settings, capabilities, meta capabilities), with its type, its doc comment, the types
  it uses, and every call that fires, hooks, fills or checks it;
- every export of the documented packages, with its signature, members and doc comment;
- the `cms` command's help, and every environment variable the code reads.

So the reference always describes the versions in `package.json`. Commerce, Stripe and
`@otwdesign/testing` are development dependencies only so their source can be read; the site doesn't
activate them.

## What the tests hold the docs to

- **Everything public has a doc comment.** An extension point or export without one fails
  `test/reference.test.ts`, naming the file and line in the CMS's source.
- **Every environment variable the code reads** is documented in
  `content/hosting/environment-variables.md`.
- **Every code sample with a `filename` compiles** against the installed packages
  (`test/samples.test.ts`), and JSON samples parse.
- **Every internal link and anchor resolves** (`test/links.test.ts`).

When the CMS changes, run `pnpm check` here: a renamed hook, a removed option or an undocumented
API shows up as a failing test, with the page and line to fix.
