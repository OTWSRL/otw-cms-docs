---
title: Vercel and serverless
description: Deploy a site to Vercel or another serverless host. PostgreSQL, migrations in the build, and updates through pull requests.
order: 4
---

Serverless hosts run many short-lived copies of a site, with no lasting disk, and build it from
its git repository. That decides three things.

## 1. Use PostgreSQL

The embedded database needs a disk that lasts, which serverless hosts don't have. Create a
PostgreSQL database (Neon, Supabase, or your host's own) and set `DATABASE_URL`.

## 2. Migrate in the build

Many copies of the site start at once, so none of them may run migrations. Set
`CMS_MIGRATIONS=deploy`, and build with the `build:deploy` script every new site has:

```json
"build:deploy": "cms generate && cms migrate --no-backup && next build"
```

On Vercel, set the project's **Build Command** to `npm run build:deploy` (or your package manager's
equivalent). Migrations then run once per deploy, before the new version takes traffic. It skips
the backup: use your database host's.

## 3. Update through pull requests

A serverless site's code is its repository, so updates are commits. Set up the update workflow,
and **Dashboard › Updates** opens a pull request with the update; merging it deploys it. See
[From the admin, on GitHub](/hosting/updates#from-the-admin-on-github).

## Environment variables

| Variable                              | Value                                                     |
| ------------------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`                        | Your PostgreSQL connection string.                        |
| `CMS_MIGRATIONS`                      | `deploy`                                                  |
| `SITE_URL`                            | The site's public address, such as `https://example.com`. |
| `CMS_GITHUB_REPO`, `CMS_GITHUB_TOKEN` | For updates from the admin.                               |

See [Environment variables](/hosting/environment-variables) for the rest.
