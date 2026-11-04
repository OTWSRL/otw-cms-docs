---
title: Installing OTW CMS
description: Create a new site with create-otw-cms, choose its plugins, and start it.
order: 1
---

`create-otw-cms` makes a new site in a folder of its own, installs its dependencies, and tells you
how to start it.

```bash
npm create otw-cms@latest my-site
cd my-site
npm run dev
```

Open <http://localhost:3000> for the site and <http://localhost:3000/admin> for the admin. With
pnpm, Yarn or Bun, use `pnpm create otw-cms my-site`, `yarn create otw-cms my-site` or
`bun create otw-cms my-site`: the site is set up for whichever one you ran it with.

## Choosing plugins

A new site has no plugins unless you ask for them. Name them with `--plugins`, separated by
commas:

```bash
npm create otw-cms@latest my-site -- --plugins @acme/forum,@acme/events
```

Each name is a plugin's npm package. A short name such as `lms` means one of the CMS's own,
`@otwdesign/plugin-lms`. You can add plugins later too; see
[Installing a plugin](/documentation/plugins#installing-a-plugin).

> [!NOTE]
> The CMS's own plugins (Commerce, Stripe, Courses, Performance and Mail to files) aren't on npm
> yet, so they can't be installed for now.

## All the options

| Option             | What it does                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `--plugins <list>` | Plugins to install: their npm packages, comma-separated.                    |
| `--no-install`     | Write the files without installing dependencies.                            |
| `--link <dir>`     | Use the CMS packages from a checkout of the CMS, to try unreleased changes. |

## What you get

The new folder is an ordinary Next.js app with a few files of its own:

- `cms.config.json` lists the installed plugins.
- `src/app/(site)/layout.tsx` and `src/app/globals.css` are the site's look. The
  [Theme Handbook](/themes) explains them.
- `.env.example` lists the settings you can give the site through its environment; copy it to
  `.env` to use them. See [Environment variables](/hosting/environment-variables).
- A `Dockerfile` and a GitHub workflow for updates, used when you [host it](/hosting).

Everything else in `src/app` is written by the CMS and starts with a line saying so. See
[Files the CMS manages](/themes/managed-files).

## Starting it in production

`npm run dev` is for working on the site. To run it for real:

```bash
npm run build
npm start
```

Or let the CMS run it, with updates from the admin: `npx cms serve`. [Hosting](/hosting) compares
the ways to run a site.
