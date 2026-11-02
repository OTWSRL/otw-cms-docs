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
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./admin": "./src/admin.tsx"
  },
  "files": ["src"],
  "peerDependencies": {
    "@otw/admin-ui": "^0.1.0",
    "@otw/plugin-commerce": "^0.1.0",
    "@otw/sdk": "^0.1.0",
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

## Saying which versions you support

The range on `@otw/sdk` says which versions of the CMS the plugin works with. `cms update` reads it
before changing anything. It moves each plugin to its newest version that supports the CMS the
site is moving to, and if a plugin has no such version, it stops and names the plugin ("doesn't
support core 0.2.0; it would be switched off") rather than update anyway. Peer ranges on other
plugins work the same way: a plugin another one still needs in an older version is held back.

Keep three things in step:

| Where                                       | Says                                         |
| ------------------------------------------- | -------------------------------------------- |
| `requires.core` in the definition           | The CMS versions the plugin loads on.        |
| The `@otw/sdk` peer dependency              | The same range, for `cms update` and npm.    |
| `requires` and the plugin peer dependencies | The versions of other plugins it works with. |

A plugin with no peer dependency on `@otw/sdk` still updates, within its caret range, but the
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

1. Run your tests, against the lowest and the newest CMS versions you support.
2. Bump the version, and update `version` in the definition to match.
3. `npm publish`.

Sites see the new version on their next update check.

## Private and paid plugins

Publish to a private registry or a scoped one with access control. Sites point npm at it in their
`.npmrc`, with a token, and `cms update` uses the same file, so private plugins update like public
ones. On GitHub, the site's update workflow reads the token from an `NPM_TOKEN` secret; see
[Updating a site](/hosting/updates).

```ini
@acme:registry=https://npm.acme.example/
//npm.acme.example/:_authToken=${NPM_TOKEN}
```
