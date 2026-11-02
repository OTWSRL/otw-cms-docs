---
title: Environment variables
description: Every environment variable OTW CMS and its plugins read, what it does, and its default.
order: 8
---

A site reads its settings from environment variables, or from a `.env` file in its directory,
which Next.js loads. A new site's `.env.example` lists the common ones; copy it to `.env`.

Variables that override a setting show in the admin read-only, with "Set by the … environment
variable". Secrets only ever come from here. The test suite of this documentation checks that
every variable the code reads is on this page.

## Database

### `DATABASE_URL`

A PostgreSQL connection string, such as `postgres://user:password@host:5432/db`. Unset, the site
uses the embedded database. See [Databases](/hosting/database).

### `CMS_DATA_DIR`

Where the embedded database lives. Default: `.data/pglite`, in the site's directory. Ignored when
`DATABASE_URL` is set.

### `CMS_MIGRATIONS`

When migrations run: `startup` (the default), as the site starts, for one server; or `deploy`, only
through `cms migrate` in the deploy step, for several servers and serverless. See
[Database migrations](/hosting/migrations).

## Uploads

### `CMS_UPLOADS_DIR`

Where the media library keeps its files. Default: `.data/uploads`, in the site's directory. A
plugin that keeps uploads elsewhere, such as S3, makes it unused. Keep it, and back it up, with the
database: `cms serve` gives every release this one folder.

### `CMS_MAX_UPLOAD_MB`

The largest file one upload may be, in megabytes, as PHP's `upload_max_filesize` limits WordPress.
Default: `64`. A proxy in front may limit request bodies too: raise nginx's `client_max_body_size`
to match.

## The site

### `SITE_URL`

The site's public address, such as `https://example.com`: no path, no trailing slash. Overrides
**Settings › General › Site address**. Used for links that leave the site, and accepted as the
site's own address by admin forms behind a proxy.

### `MAIL_FROM`

Who the site's email comes from, such as `My Site <hello@example.com>`. Overrides **Settings ›
General › Send email from**. Unset and empty there, the mail plugin's own sender is used. See
[Email](/plugins/mail).

### `SITE_LOCALE`

How numbers and prices are formatted, such as `en-US` or `de-DE`. Overrides **Settings › General ›
Locale**. Default: `en-US`.

### `CMS_TRUST_PROXY`

Set to `1` (or `true`) behind a reverse proxy you run, to take the visitor's address from
`X-Forwarded-Host` and `X-Forwarded-Proto`. See [Behind a reverse proxy](/hosting/reverse-proxy).

### `CMS_SECRET`

Signs the one-time messages admin forms show. Unset, the site makes a random secret and stores it
in the database, which every server shares. Set it, to a long random string, to keep that secret
out of the database.

### `CMS_ACTIVE_PLUGINS`

A comma-separated list of plugin ids, such as `commerce,commerce-stripe`. Fixes which plugins are
active, and turns off activating them in the admin. Unset, the admin manages activation.

### `PORT`

The port the site listens on: `next start`'s, and `cms serve`'s public port. Default: 3000.

## Updates

### `CMS_GITHUB_REPO`

The site's GitHub repository, as `owner/name`, for updates through pull requests. See
[From the admin, on GitHub](/hosting/updates#from-the-admin-on-github).

### `CMS_GITHUB_TOKEN`

A token that may start the repository's workflows (a fine-grained token with Actions: read and
write). Needed with `CMS_GITHUB_REPO`. Keep it secret.

### `CMS_GITHUB_WORKFLOW`

The update workflow's file name. Default: `cms-update.yml`.

### `CMS_GITHUB_REF`

The branch the update workflow runs on. Default: `main`.

### `CMS_SUPERVISOR_URL`

Set by `cms serve` for the releases it starts, so the admin can reach it. Don't set it yourself.

### `CMS_SUPERVISOR_TOKEN`

Set by `cms serve` with `CMS_SUPERVISOR_URL`: the random token the admin uses with it. Don't set
it yourself.

### `CMS_UPDATE_CHECK_EVERY_MS`

How often `cms serve` checks for updates, in milliseconds. Default: twelve hours. For testing.

## Plugins

Plugins document the variables they read. The CMS's own:

### `COMMERCE_CURRENCY`

The shop's currency, as a three-letter code such as `EUR`. Overrides **Settings › Shop ›
Currency**. Default: `USD`.

### `STRIPE_SECRET_KEY`

Stripe's secret key, `sk_live_…` or `sk_test_…`. Until it's set, Stripe stays out of checkout.

### `STRIPE_WEBHOOK_SECRET`

The signing secret of the Stripe webhook endpoint pointing at `/api/p/commerce-stripe/webhook`,
`whsec_…`.

### `MAIL_FILE_DIR`

The folder **Mail to files** writes each email to, for development and tests. Default:
`.data/mail`, in the site's directory.
