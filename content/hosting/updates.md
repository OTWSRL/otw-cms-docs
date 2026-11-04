---
title: Updating a site
description: Update the CMS and plugins from the command line, from the admin with cms serve, or from the admin through a GitHub pull request.
order: 7
---

A site's version of the CMS and of each plugin is in its `package.json`, so updating is changing
those versions, installing, and deploying. `cms update` does the first two safely, and the admin
can start it, depending on the host.

## From the command line

```bash
npx cms update --check   # what's new, and which plugins support it
npx cms update           # update the CMS and plugins, install, regenerate routes
npx cms migrate          # back up, then migrate (stop the site first)
npm run build            # then restart the site
```

`cms update`:

- Moves the CMS within its compatible range, and each plugin to its newest version that supports
  the CMS the site ends up on. It reads which versions each plugin supports from its peer
  dependencies, before changing anything.
- Stops, saying why, if the update would leave a plugin without a supported version, since that
  plugin would be switched off. `--force` updates anyway.
- Installs with the site's package manager, then runs the new version's `cms generate`, so the
  [managed route files](/themes/managed-files) match it.

| Command                           | Updates                                                             |
| --------------------------------- | ------------------------------------------------------------------- |
| `cms update`                      | The CMS and every plugin.                                           |
| `cms update commerce @acme/forum` | Only those plugins, by short name or package.                       |
| `cms update core`                 | Only the CMS.                                                       |
| `cms update --plugins-only`       | Every plugin, and not the CMS.                                      |
| `cms update --major`              | Also allows a new major version of the CMS.                         |
| `cms update --commit`             | Puts the update on a new git branch, for hosts that build from git. |

Versions come from `npm view` run in the site's directory, so the registries and tokens in the
site's `.npmrc` apply, for private and paid plugins. A plugin npm can't reach is reported and left
as it is.

## From the admin, with `cms serve`

On your own server with `cms serve`, **Dashboard › Updates** runs all of this, builds the new
version beside the running one, and switches over. See [Your own server](/hosting/your-own-server).

## From the admin, on GitHub

For sites built from GitHub (Vercel and similar), the update runs in a GitHub Actions workflow and
arrives as a pull request. Every new site includes the workflow, in
`.github/workflows/cms-update.yml`.

1. **Allow the workflow to open pull requests**: in the repository's **Settings › Actions ›
   General**, tick **Allow GitHub Actions to create and approve pull requests**.
2. **Create a token** that may start the workflow: a fine-grained personal access token for the
   repository with **Actions: Read and write**.
3. **Set the site's environment**: `CMS_GITHUB_REPO=owner/name` and `CMS_GITHUB_TOKEN=<the token>`.
4. **For private plugins**, add an `NPM_TOKEN` secret to the repository; the workflow passes it to
   `.npmrc` as `${NPM_TOKEN}`.

**Dashboard › Updates** then offers **Check for updates and open a pull request**. The workflow
runs `cms update --commit` and opens a pull request with the result; merging it deploys the
update, and the deploy's `build:deploy` runs the migrations. The workflow also runs every week on
its own; remove its `schedule` to only run it when asked.

To run it yourself, open the workflow under the repository's **Actions** tab and click **Run
workflow**. It takes two inputs: **packages**, the plugins to update or `core` (empty updates
everything), and **plugins_only**, which leaves the CMS itself where it is. They're `cms update`'s
package names and `--plugins-only`.

`CMS_GITHUB_WORKFLOW` and `CMS_GITHUB_REF` name a different workflow file or branch, when the
defaults (`cms-update.yml` on `main`) don't fit.

## Otherwise

On hosts where neither applies, **Dashboard › Updates** shows the site's version and the commands
above, for whoever deploys it.
