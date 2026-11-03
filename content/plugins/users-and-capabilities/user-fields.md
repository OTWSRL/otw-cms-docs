---
title: User fields
description: Give users typed, validated fields, like WordPress's user meta, shown on the admin's Profile and Edit User screens and, if you say, on their own account page; and add sections to the account page.
order: 2
---

User fields are WordPress's user meta: a student's level, a customer's newsletter choice, an
author's bio. Each is registered with a type and checked on every save, exactly as entries'
[custom fields](/plugins/content/meta) are, and the admin shows them on **Users › Profile** and
**Edit User** without a form of your own: WordPress's `show_user_profile` and
`edit_user_profile`, done for you.

## Registering a field

```ts filename="src/index.ts"
import { definePlugin } from '@otwdesign/sdk'

declare module '@otwdesign/sdk' {
  interface UserMeta {
    'lms.bio': string
    'lms.level': string
    'lms.newsletter': boolean
  }
}

export default definePlugin({
  id: 'lms',
  version: '1.0.0',
  setup(cms) {
    // On the admin's screens, and on the student's own account page.
    cms.users.meta('lms.bio', { label: 'Bio', type: 'string', multiline: true, onAccount: true })
    cms.users.meta('lms.newsletter', {
      label: 'Course news by email',
      type: 'boolean',
      onAccount: true,
    })
    // Customers only, set by the staff.
    cms.users.meta('lms.level', {
      label: 'Level',
      type: 'string',
      options: ['beginner', 'intermediate', 'expert'],
      default: 'beginner',
      roles: ['customer'],
      capability: 'core.manage_users',
    })
  },
})
```

Keys start with the plugin's id. The types and their options are custom fields':
`string` (with `options`, `multiline`, `maxLength`, `validate`), `number`, `boolean`,
`strings` and `json`. Three options are users' own:

| Option       | What it does                                                                     |
| ------------ | -------------------------------------------------------------------------------- |
| `roles`      | The roles whose users have it. Every role's when left out.                       |
| `onAccount`  | Shows it on the person's own `/account` page too, for them to change.            |
| `capability` | Who may change it in the admin, as for custom fields. Never on the account page. |

## Reading and writing

```ts filename="src/levels.ts"
import type { PluginContext } from '@otwdesign/sdk'

/** Moves a student up a level, as a course's completion might. */
export async function levelUp(cms: PluginContext, userId: string) {
  const { 'lms.level': level } = await cms.users.getMeta(userId)
  const next = level === 'beginner' ? 'intermediate' : 'expert'
  return cms.users.updateMeta(userId, { 'lms.level': next })
}
```

| Method                        | Like WordPress's     | Does                                                               |
| ----------------------------- | -------------------- | ------------------------------------------------------------------ |
| `getMeta(userId)`             | `get_user_meta()`    | Every field, defaults filled in                                    |
| `getMetaMany(userIds)`        |                      | A page of users' fields in one query                               |
| `updateMeta(userId, changes)` | `update_user_meta()` | Sets the fields named; `null` removes one. Checked, all or nothing |
| `fields(role?)`               |                      | The fields registered, or a role's                                 |
| `get(id)`                     | `get_userdata()`     | The user, or `null`                                                |
| `isVerified(userId)`          |                      | Whether they've proved their email address                         |

A value that isn't valid, or a field the user's role doesn't have, throws a `ContentError`
saying which, as custom fields do.

## On the account page

Fields with `onAccount` go on the signed-in person's `/account` page, under **Your details**,
and only those: the page's form can't change any other field, whatever it sends.

A plugin adds a section of its own to the account page by filling the `account.sections` slot,
like a tab of WooCommerce's My Account. Commerce adds the person's **Orders** that way. A section
shows only what's theirs: an address anyone can type at checkout is matched to an account only
once its owner has proved it.

```tsx filename="src/account.tsx"
import type { PluginContext } from '@otwdesign/sdk'

/** The student's courses, on their account page. */
export function addCoursesSection(cms: PluginContext) {
  cms.slots.fill('account.sections', {
    component: async ({ user }) => {
      const { 'lms.level': level } = await cms.users.getMeta(user.id)
      return (
        <section aria-labelledby="account-courses">
          <h2 id="account-courses">Your courses</h2>
          <p>Your level: {level}.</p>
        </section>
      )
    },
  })
}
```

## How it differs from WordPress

- **Fields are registered and checked**, as custom fields are: user meta in WordPress takes any
  key and any value.
- **The screens are made for you.** No `show_user_profile` markup or
  `personal_options_update` saving to write.
- **A field can be limited to roles**, and to the admin, or offered on the account page.
