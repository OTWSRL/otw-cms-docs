---
title: Custom fields
description: Give entries typed, validated custom fields, as WordPress's register_meta() does, and show them on the edit screen without writing a form.
order: 2
---

Custom fields are WordPress's post meta: a course's level, its length in hours, whether it's
featured. Each is registered with a type and checked on every save, so what's stored is always
valid, and a field box shows them on the edit screen with no form code of your own.

## Registering a field

Declare each field's value type on the `EntryMeta` interface, then register it in `setup()`. Its
key starts with the plugin's id, and `types` says which content types have it.

```ts filename="src/index.ts"
import { definePlugin } from '@otw/sdk'

declare module '@otw/sdk' {
  interface ContentTypes {
    'lms.course': true
  }
  interface EntryMeta {
    'lms.level': string
    'lms.hours': number
    'lms.featured': boolean
    'lms.skills': string[]
  }
}

export default definePlugin({
  id: 'lms',
  version: '1.0.0',
  requires: { core: '^0.1.0' },
  setup(cms) {
    cms.content.type('course', { labels: { singular: 'Course', plural: 'Courses' }, public: true })
    const types = ['lms.course'] as const
    cms.content.meta('lms.level', {
      types,
      label: 'Level',
      type: 'string',
      options: ['beginner', { value: 'advanced', label: 'Advanced' }],
      default: 'beginner',
    })
    cms.content.meta('lms.hours', { types, label: 'Hours', type: 'number', integer: true, min: 1 })
    cms.content.meta('lms.featured', { types, label: 'Featured', type: 'boolean' })
    cms.content.meta('lms.skills', { types, label: 'Skills', type: 'strings' })
  },
})
```

| Type      | Holds                                  | Options                                         |
| --------- | -------------------------------------- | ----------------------------------------------- |
| `string`  | Text, tidied of control characters     | `maxLength`, `multiline`, `options`, `validate` |
| `number`  | A number                               | `integer`, `min`, `max`                         |
| `boolean` | True or false                          |                                                 |
| `strings` | A list of short texts                  | `maxItems`, `maxLength`                         |
| `json`    | Any JSON, which `validate` must accept | `validate` (required)                           |

Every type takes a `label`, a `description`, a `default`, and a `capability` that the edit
screen requires to change the field, on top of editing the entry. A default must pass the
field's own checks.

## Reading and writing

An entry's `meta` holds its fields, typed by `EntryMeta`. A field it has no value for shows its
default.

```ts filename="src/featured.ts"
import type { PluginContext } from '@otw/sdk'

/** Features a course, and lists the featured ones. */
export async function feature(cms: PluginContext, id: string) {
  await cms.content.update(id, { meta: { 'lms.featured': true, 'lms.hours': null } })
  const { entries } = await cms.content.list({
    type: 'lms.course',
    meta: { 'lms.featured': true },
  })
  return entries.map((course) => `${course.title}: ${course.meta['lms.level']}`)
}
```

- **`create()` and `update()` take `meta`**, and change only the keys named: a value sets a
  field, `null` removes it, so its default shows again.
- **Every value is checked** against its field, and a key no plugin registered for the type is
  refused. What the `content.entry` filter changes is checked the same way.
- **`list({ meta })`** finds entries whose fields have those values, answered by an index. An
  entry without a field doesn't match, even if its default would.
- **A deactivated plugin's fields keep their values.** Entries still show them, but they can't
  be changed until the plugin is back.
- **`metaFields(type)`** lists the fields a type has.

## Field boxes

A meta box with `fields` instead of a component shows them as a form table, and the CMS saves
them with the entry, as a settings section does for settings. Register it in the admin entry:

```ts filename="src/admin.tsx"
import { defineAdmin } from '@otw/sdk'
import lms from './index'

export default defineAdmin(lms, (cms) => {
  cms.admin.metaBox('lms.course', {
    name: 'details',
    title: 'Course details',
    context: 'side',
    fields: ['lms.level', 'lms.hours', 'lms.featured', 'lms.skills'],
  })
})
```

- **Each type gets its input**: a dropdown for options, a number field, a checkbox, a text area
  with one item per line for `strings`, and JSON for `json`.
- **An empty input removes the field**, so its default shows; an unticked checkbox saves `false`.
- **Fields the user may not change** (their `capability`) show disabled, and the save refuses
  them if they're sent anyway.
- **Bad input goes back to the form** with the field's label: "Hours must be at least 1".
- A box can show another plugin's fields. One that names a field no active plugin registers is
  reported in the site's warnings.

## How it differs from WordPress

- **Fields are registered or refused.** WordPress stores any key; here a typo is an error, not a
  stray row.
- **One object per entry**, not a row per key: fields load with the entry, so a list needs no
  extra query, and a save writes them with the rest of the entry.
- **Typed values**, not strings: numbers are numbers, and lists are lists, not serialized PHP.
- Not yet: term meta, and ordering lists by a field.
