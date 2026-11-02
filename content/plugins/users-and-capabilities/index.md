---
title: Roles and capabilities
description: Add roles, declare capabilities, grant them to any role, and check them, as WordPress's add_role(), add_cap() and current_user_can() do.
order: 7
---

Who may do what follows WordPress's model. A user has one **role**, a role grants
**capabilities**, and every admin screen, action and check asks for a capability.
**Administrators** have every capability there is.

The difference: nothing is stored. Roles and grants are rebuilt from the active plugins every time
the site starts, so deactivating a plugin takes away the roles and capabilities it added, and
there's no leftover `wp_user_roles` row to clean up.

## Declaring capabilities

A capability is declared twice: its name on the `Capabilities` interface, for types, and its
label and starting roles with `cms.auth.capability()` in `setup()`, not in the admin entry: the
site's pages and the API check capabilities too.

```ts filename="src/index.ts"
import { definePlugin } from '@otw/sdk'

declare module '@otw/sdk' {
  interface Capabilities {
    /** Create, edit and publish courses. */
    'lms.manage_courses': true
    /** See every learner's progress. */
    'lms.view_reports': true
  }
}

export default definePlugin({
  id: 'lms',
  version: '1.0.0',
  name: 'Courses',
  requires: { core: '^0.1.0' },
  setup(cms) {
    // A role of its own, which may use the admin.
    cms.auth.role('teacher', { label: 'Teacher', capabilities: ['core.access_admin'] })

    cms.auth.capability('lms.manage_courses', { label: 'Manage courses', roles: ['teacher'] })
    cms.auth.capability('lms.view_reports', { label: 'View learner reports' })

    // Another plugin's role, if a plugin that defines it is active.
    cms.auth.grant('shop_manager', ['lms.view_reports'])
  },
})
```

- **`role(id, { label, capabilities })`** adds a role, like `add_role()`. Ids are plain
  (`teacher`, `shop_manager`); each can be defined by one plugin.
- **`capability(name, { label, roles })`** declares one of this plugin's capabilities, and the roles
  that start with it. The name must start with the plugin's id.
- **`grant(role, capabilities)`** gives any role, including other plugins', more capabilities, like
  `add_cap()`. **`revoke(role, capabilities)`** takes them away, like `remove_cap()`.

Grants and revokes apply after every plugin has set up, grants first, in load order. A grant to a
role no active plugin defines is dropped. The `administrator` role can't be changed: it always has
everything.

**Users › Roles** lists every role and its capabilities, as they stand.

## Checking capabilities

Admin pages and actions name their `capability`, and the CMS checks it for you. Elsewhere, ask
`cms.auth.can()`, like `current_user_can()`:

```tsx
component: ({ user }) => (
  <>
    <CourseList />
    {cms.auth.can(user, 'lms.view_reports') && <ReportsLink />}
  </>
)
```

`can(null, …)` is always false: signed-out visitors have no capabilities. On the site, get the
signed-in user with `getCurrentUser()`; see [Using the CMS in your pages](/themes/cms-data).

## Capabilities the CMS defines

| Capability             | Allows                                                                 | Who has it               |
| ---------------------- | ---------------------------------------------------------------------- | ------------------------ |
| `core.access_admin`    | Using the admin at all; every admin screen needs it as well as its own | Roles that use the admin |
| `core.manage_plugins`  | Activating and deactivating plugins, and updating their databases      | Administrators           |
| `core.manage_settings` | Settings › General, and settings pages without their own capability    | Administrators           |
| `core.manage_users`    | Adding users and changing roles                                        | Administrators           |
| `core.manage_updates`  | Updating the CMS and plugins                                           | Administrators           |

The core roles are `administrator` and `customer`, which has no capabilities. Every capability
on a site is listed under [Capabilities](/reference/capabilities) in the Code Reference.

## When a capability isn't declared

An admin page or action that names a capability nobody declared still works for administrators,
who have everything, and nobody else. The Dashboard warns about it, so the typo gets noticed.

## Checks against an object

"May this user edit _this_ course?" depends on the course: whose it is, whether it's published.
That's a [meta capability](/plugins/users-and-capabilities/meta-capabilities).
