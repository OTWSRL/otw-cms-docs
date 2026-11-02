---
title: Meta capabilities
description: Decide what a user may do with a particular object, as WordPress's map_meta_cap does, and extend another plugin's rules.
order: 1
---

A meta capability is a question about one object: may this user cancel _this_ order? Like
WordPress's `edit_post`, it **maps** the object to the plain capabilities it needs. Commerce
allows cancelling an order only while it's pending, and then only to people who manage orders.

Entries of a [content type](/plugins/content) come with WordPress's meta capabilities already
mapped, such as `lms.edit_course`. Declare your own for anything else.

## Declaring one

Declare its arguments on `MetaCapabilities`, then its `map` in `setup()`. The map receives the
user and the object, and returns the capabilities the user needs, every one of them, or `false`
to refuse everyone, administrators included (WordPress's `do_not_allow`).

```ts filename="src/index.ts"
import { definePlugin, type User } from '@otw/sdk'

export interface Course {
  id: string
  authorId: string
  published: boolean
}

declare module '@otw/sdk' {
  interface Capabilities {
    /** Create courses and edit your own. */
    'lms.edit_courses': true
    /** Edit courses other people wrote. */
    'lms.edit_others_courses': true
  }
  interface MetaCapabilities {
    /** Edit one course: your own, or anyone's with `lms.edit_others_courses`. */
    'lms.edit_course': [course: Course]
  }
}

export default definePlugin({
  id: 'lms',
  version: '1.0.0',
  requires: { core: '^0.1.0' },
  setup(cms) {
    cms.auth.capability('lms.edit_courses', { label: 'Edit courses' })
    cms.auth.capability('lms.edit_others_courses', { label: "Edit others' courses" })
    cms.auth.metaCapability('lms.edit_course', {
      label: 'Edit a course',
      map: (user: User, course) =>
        course.authorId === user.id ? ['lms.edit_courses'] : ['lms.edit_others_courses'],
    })
  },
})
```

## Checking one

Pass the object to `can()`. The map runs on the object you already have, so checking every row
of a list costs no queries:

```ts
const editable = courses.filter((course) => cms.auth.can(user, 'lms.edit_course', course))
```

Where a page or action needs the check, load the object, then refuse with `ForbiddenError`,
which answers 403:

```ts
load: async ({ params, user }) => {
  const course = await findCourse(params.id!)
  if (!course) return null
  if (!cms.auth.can(user, 'lms.edit_course', course)) throw new ForbiddenError()
  return course
},
```

A map that throws counts as a refusal, and the error is logged with the plugin's id.

## Extending another plugin's rules

`cms.auth.extendCapability()` adjusts another plugin's meta capability, like WordPress's
`map_meta_cap` filter. It receives what the owner's map (and earlier extensions) decided, and
returns the final answer.

Commerce lets people mark an order paid by hand only for its own "Pay later" orders. A bank
transfer plugin, whose orders are also paid by hand, extends that for its orders:

```ts filename="src/bank-transfer.ts"
import type { PluginContext } from '@otw/sdk'
import type {} from '@otw/plugin-commerce'

export function allowMarkingPaid(cms: PluginContext) {
  cms.auth.extendCapability('commerce.mark_order_paid', (required, _user, order) =>
    order.gateway === 'bank-transfer' && order.status === 'pending'
      ? ['commerce.manage_orders']
      : required,
  )
}
```

Extensions run after the owner's map, in the order plugins load. Return `required` unchanged for
the cases you don't handle.
