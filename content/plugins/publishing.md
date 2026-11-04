---
title: Publishing
description: Package a plugin for npm, declare which versions of the CMS and other plugins it supports, version it, and ship updates sites can install safely.
order: 11
---

A plugin is an npm package, published to npm or to a private registry. Sites install it like any
package, and `cms update` (or Dashboard › Updates) keeps it current.

## The package

```json filename="package.json"
{
  "name": "@acme/plugin-gift-cards",
  "version": "1.0.0",
  "description": "Sell gift cards and redeem them at checkout.",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/acme/plugin-gift-cards.git"
  },
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./admin": "./src/admin.tsx"
  },
  "files": ["src"],
  "publishConfig": {
    "access": "public"
  },
  "peerDependencies": {
    "@otwdesign/admin-ui": "^1.0.0",
    "@otwdesign/plugin-commerce": "^1.0.0",
    "@otwdesign/sdk": "^1.0.0",
    "drizzle-orm": ">=0.45.0",
    "react": "^19.0.0"
  }
}
```

- **Ship the TypeScript source.** Sites compile plugins along with themselves, so `exports` points
  at `src/index.ts`, and at the [admin entry](/plugins/admin#the-admin-entry) as `./admin`, and
  there's no build step. The site's `withCms()` tells Next.js which packages
  to compile.
- **The CMS's packages are peer dependencies**, and so are `react` and `drizzle-orm`: the site
  provides one copy that the CMS and every plugin share. Two copies would mean two React
  runtimes, and database types that don't match.
- **Plugins you require are peer dependencies too**, with the range you support, matching
  `requires` in the definition.
- **Everything else is a normal dependency**, such as a payment provider's SDK.
- **A scoped package is private on npm unless it says otherwise.** `publishConfig.access` makes
  `npm publish` publish it publicly; leave it out for a paid plugin on a private registry.
- **`repository`** links the package on npm to its source, and npm's
  [provenance](https://docs.npmjs.com/generating-provenance-statements) checks it.

## Saying which versions you support

The range on `@otwdesign/sdk` (or on `@otwdesign/next`, for a plugin that needs only that) says
which versions of the CMS the plugin works with. `cms update` reads it
before changing anything. It moves each plugin to its newest version that supports the CMS the
site is moving to, and if a plugin has no such version, it stops and names the plugin ("doesn't
support core 2.0.0; it would be switched off") rather than update anyway. Peer ranges on other
plugins work the same way: a plugin another one still needs in an older version is held back.

Keep three things in step:

| Where                                       | Says                                         |
| ------------------------------------------- | -------------------------------------------- |
| `requires.core` in the definition           | The CMS versions the plugin loads on.        |
| The `@otwdesign/sdk` peer dependency        | The same range, for `cms update` and npm.    |
| `requires` and the plugin peer dependencies | The versions of other plugins it works with. |

A plugin with no peer dependency on `@otwdesign/sdk` still updates, within its caret range, but the
update marks it "compatibility unknown".

## Versioning

Use [semver](https://semver.org), counting your extension points as API:

- **Patch** (1.0.1): fixes. Sites with automatic updates install these on their own, so never
  put a migration that changes existing data in a patch.
- **Minor** (1.1.0): new features, new hooks, new fields in a payload, new settings.
- **Major** (2.0.0): anything that could break a site or another plugin: a removed or renamed hook,
  setting or service method, a changed payload, a migration that drops data, a raised minimum
  CMS version.

## Releasing

By hand:

1. Run your tests, against the lowest and the newest CMS versions you support.
2. Bump the version in `package.json`, and `version` in the definition to match: the Plugins screen
   shows the definition's.
3. `npm publish`.

Sites see the new version on their next update check.

### With Changesets and GitHub Actions

The CMS's own plugins release this way, with no npm token anywhere, and
[Performance](https://github.com/OTWSRL/otw-plugin-performance) is a complete example to copy.

- **Each change that should reach npm comes with a changeset**: run `pnpm changeset`, pick the
  bump, and write the line for the changelog. Commit the file with the change.
- **The version in the definition follows `package.json`.** `changeset version` bumps only
  `package.json`, so a short script copies the new version into the definition, and a test fails
  if the two ever differ:

  ```json
  {
    "scripts": {
      "changeset": "changeset",
      "version-packages": "changeset version && node scripts/sync-plugin-version.mjs",
      "release": "changeset publish"
    }
  }
  ```

- **Changesets counts only the packages the workspace lists.** When the plugin is the
  repository's root and its [development site](/plugins/testing#a-development-site) sits in
  `site/`, `pnpm-workspace.yaml` lists both, `.` and `site`.
- **A release workflow runs after CI passes on `main`.** While changesets are waiting, it opens a
  "Version Packages" pull request with the bump and the changelog; merging that pull request
  publishes. Performance's
  [`release.yml`](https://github.com/OTWSRL/otw-plugin-performance/blob/main/.github/workflows/release.yml)
  does it in four jobs, and only the one that publishes may ask GitHub for an identity token.
  It also checks out the CMS beside the plugin, because Performance is developed against a
  checkout of the CMS; a plugin that takes the CMS from npm leaves those steps out.

npm's [trusted publishing](https://docs.npmjs.com/trusted-publishers) replaces the token: npm
trusts a publish from your repository's workflow. To set it up:

1. Publish the first version by hand. A trusted publisher is set on a package that already exists.
2. On npmjs.com, in the package's settings, add GitHub Actions as its trusted publisher: the
   repository's owner and name, and the workflow's file name, `release.yml`. Allow `npm publish`,
   not only staged publishing, which Changesets doesn't use. Save the connection.
3. In the workflow, the publishing job needs `permissions: id-token: write`, npm 11.5.1 or newer
   (`npm install --global npm@11`), and `registry-url: https://registry.npmjs.org` on
   `actions/setup-node`.
4. In the repository's settings, under Actions › General, allow GitHub Actions to create and
   approve pull requests, for the Version Packages pull request.

A refused publish is explained only in npm's detailed log, so set `NPM_CONFIG_LOGLEVEL: verbose`
on the publishing step.

## How sites install it

A site adds a published plugin with its package manager and lists it in `cms.config.json`; see
[Installing a plugin](/documentation/plugins#installing-a-plugin). A new site can start with it:

```bash
npm create otw-cms@latest my-site -- --plugins @acme/plugin-gift-cards
```

The scaffolder asks npm for the plugin's newest version and depends on it with a caret range, so
publish before you tell people to install. Short names, such as `performance`, are only for the
CMS's own plugins.

## Private and paid plugins

Publish to a private registry or a scoped one with access control. Sites point npm at it in their
`.npmrc`, with a token, and `cms update` uses the same file, so private plugins update like public
ones. On GitHub, the site's update workflow reads the token from an `NPM_TOKEN` secret; see
[Updating a site](/hosting/updates).

```ini
@acme:registry=https://npm.acme.example/
//npm.acme.example/:_authToken=${NPM_TOKEN}
```
