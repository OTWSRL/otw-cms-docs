---
title: Content types
description: Register content types and work with their entries, as WordPress's register_post_type() and wp_insert_post() do, with capabilities for own, others' and published entries.
order: 7.5
---

Content types are WordPress's post types: the CMS's Posts and Pages, and a plugin's courses,
lessons or recipes. Their entries are WordPress's posts. Every type's entries share one table and
one set of rules for statuses, slugs, authors and capabilities, so a plugin gets them by
registering a type.

> [!NOTE]
> The admin's list and edit screens for content types come next. Until then a plugin builds its
> screens with [the admin components](/plugins/admin/components) and the API on this page.

## Registering a type

Register types in `setup()`, not in the admin entry, so every part of the site knows them. The
name is qualified with the plugin's id: `course` in the `lms` plugin is `lms.course`. Add it to
the `ContentTypes` interface too, which types its capability names.

```ts filename="src/index.ts"
import { definePlugin } from '@otw/sdk'

declare module '@otw/sdk' {
  interface ContentTypes {
    'lms.course': true
  }
}

export default definePlugin({
  id: 'lms',
  version: '1.0.0',
  name: 'Courses',
  requires: { core: '^0.1.0' },
  setup(cms) {
    cms.auth.role('teacher', { label: 'Teacher', capabilities: ['core.access_admin'] })
    cms.content.type('course', {
      labels: { singular: 'Course', plural: 'Courses' },
      public: true,
      supports: ['title', 'body', 'excerpt', 'author'],
      // Editors manage every course; teachers write and publish their own.
      roles: { editor: 'editor', teacher: 'author' },
    })
  },
})
```

| Field          | What it is                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `labels`       | `singular` and `plural`, such as `Course` and `Courses`.                                                                    |
| `plural`       | The plural in its capability names. Defaults to the name and an `s`; set it for others, as `people`, in `ContentTypes` too. |
| `public`       | Its published entries get pages on the site. Defaults to `false`.                                                           |
| `hierarchical` | Entries can have a parent of the same type, as pages do. Defaults to `false`.                                               |
| `supports`     | What its entries use: `title`, `body`, `excerpt`, `author`, `position`. Defaults to `title` and `body`, as in WordPress.    |
| `roles`        | Which roles get its capabilities, and at what level. Defaults to WordPress's for posts: Editor, Author and Contributor.     |
| `description`  | What the type is for.                                                                                                       |

A type whose plural isn't the name and an `s` declares it on both sides:
`'crew.person': { plural: 'people' }` in `ContentTypes`, and `plural: 'people'` in the definition.

## Posts and pages

The CMS registers WordPress's two types, and its roles for writing them:

| Role        | Posts (`core.post`)                                   | Pages (`core.page`, hierarchical) |
| ----------- | ----------------------------------------------------- | --------------------------------- |
| Editor      | Everyone's, published and private included            | Everyone's                        |
| Author      | Their own, publishing included                        | None                              |
| Contributor | Their own drafts, which an editor or author publishes | None                              |

All three use the admin. A plugin type with no `roles` gets the same levels as posts.

## Capabilities

A type declares WordPress's capabilities, under its plugin's id. For `lms.course`:

| Capability                                                                                                      | Lets a role                                         |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `lms.edit_courses`                                                                                              | Write courses, and edit and delete their own drafts |
| `lms.edit_others_courses`                                                                                       | Edit anyone's                                       |
| `lms.edit_published_courses`                                                                                    | Edit published ones, as well                        |
| `lms.edit_private_courses`                                                                                      | Edit private ones, as well                          |
| `lms.publish_courses`                                                                                           | Publish                                             |
| `lms.read_private_courses`                                                                                      | Read private ones                                   |
| `lms.delete_courses`, `lms.delete_others_courses`, `lms.delete_published_courses`, `lms.delete_private_courses` | The same, for deleting                              |

Its **meta capabilities** take an entry and work out which of those it needs, as WordPress's
`map_meta_cap` does for posts:

- **`lms.edit_course`** and **`lms.delete_course`**: an author needs `edit_courses` for their
  own course, or `edit_published_courses` once it's published. Anyone else needs
  `edit_others_courses`, plus `edit_published_courses` or `edit_private_courses` for those. An
  entry in the trash goes by the status it had.
- **`lms.read_course`**: published courses and one's own need only `core.read`, which every role
  has; private ones `read_private_courses`; anyone else's drafts as much as editing them.
- **`lms.publish_course`**: `publish_courses`, whoever wrote it.

An entry of another type is refused, administrators included, so a page can't be checked as a
post. Other plugins can change a mapping with `cms.auth.extendCapability()`; see
[Meta capabilities](/plugins/users-and-capabilities/meta-capabilities).

`roles` gives a role one of three levels, named after WordPress's roles:

| Level         | Capabilities, for courses                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `editor`      | All ten                                                                                                                       |
| `author`      | `lms.edit_courses`, `lms.edit_published_courses`, `lms.publish_courses`, `lms.delete_courses`, `lms.delete_published_courses` |
| `contributor` | `lms.edit_courses` and `lms.delete_courses`                                                                                   |

Like every grant, they aren't stored: deactivate the plugin, and they go with its type.

## Entries

`cms.content` reads and writes entries anywhere: in admin actions, API routes, hooks and the
site's pages.

```tsx filename="src/admin.tsx"
import { ActionError, defineAdmin, ForbiddenError } from '@otw/sdk'
import lms from './index'

export default defineAdmin(lms, (cms) => {
  cms.admin.action({
    name: 'publish',
    capability: 'lms.edit_courses',
    async handler({ form, user }) {
      const course = await cms.content.get(String(form.get('id')))
      if (!course) throw new ActionError('That course no longer exists.')
      // The content API checks no capabilities, like wp_insert_post(): its callers do.
      if (!cms.auth.can(user, 'lms.publish_course', course)) throw new ForbiddenError()
      await cms.content.update(course.id, { status: 'published' })
      return { notice: `${course.title} is published.` }
    },
  })
})
```

| Method                                | Like WordPress's                       | Does                                                                         |
| ------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| `create(type, fields)`                | `wp_insert_post()`                     | Adds an entry. Every field is optional: it starts as an untitled draft.      |
| `update(id, changes)`                 | `wp_update_post()`                     | Changes the fields given. An entry in the trash must be restored first.      |
| `get(id)`                             | `get_post()`                           | The entry, or `null`.                                                        |
| `getBySlug(type, slug, { parentId })` | `get_page_by_path()`                   | The published or private entry with that slug, at the top or under a parent. |
| `list(query)`                         | `WP_Query`                             | A page of entries and how many match: by type, status, author or parent.     |
| `trash(id)`, `restore(id)`            | `wp_trash_post()`, `wp_untrash_post()` | Into the trash, and back out as a draft.                                     |
| `delete(id)`                          | `wp_delete_post()`                     | Deletes for good. Its children move up to its parent.                        |

`list()` returns everything but the trash unless asked, newest first by WordPress's post date
(when it was published, or created if it never was). It also orders by `updated`, `title` and
`position`, 20 to a page and at most 100.

Entries have a `title`, an `excerpt`, a `body`, an `authorId`, a `parentId`, a `position` for
ordering by hand (WordPress's `menu_order`), and `publishedAt`, set when the entry is first
published. A date in the past backdates it; one in the future is refused until scheduling comes.
The `body` is a list of blocks, stored as JSON and rendered by React components, so stored content
can't add markup of its own. Bad input throws a `ContentError` whose message is safe to show.

## Statuses

| Status      | Who sees it                                                        |
| ----------- | ------------------------------------------------------------------ |
| `draft`     | Its author, and whoever may edit others' entries                   |
| `pending`   | The same: a contributor's draft, waiting for someone to publish it |
| `published` | Everyone                                                           |
| `private`   | Its author, and whoever may read private entries of the type       |
| `trash`     | As before it was trashed: checks go by the status it had           |

## Slugs

An entry's slug comes from its title: lowercase, accents taken off Latin letters, other scripts
kept (`Привет мир` is `привет-мир`). Published and private entries own theirs: no other published
or private entry of the type has it, nor of the same parent for hierarchical types. A taken slug
gets `-2`, `-3`, as in WordPress, and a database index keeps two saves at once from taking the
same one.

Drafts own no slug, so a draft's follows its title until it's published, unless one is set.
An entry in the trash frees its slug; restored, it's a draft, and takes a free one when it's
published again.

## Pages and other hierarchical types

An entry of a hierarchical type can have a parent of the same type, but not itself, one of its
own descendants, or an entry in the trash. Deleting a parent moves its children up to the
parent's parent, renaming any whose slug is taken there.

## Hooks

| Hook               | When                                                           | Like WordPress's         |
| ------------------ | -------------------------------------------------------------- | ------------------------ |
| `content.entry`    | Filter: the fields `create()` and `update()` are about to save | `wp_insert_post_data`    |
| `content.status`   | A new entry's first status, or a change of status              | `transition_post_status` |
| `content.saved`    | After any save, trashing and restoring included                | `save_post`              |
| `content.trashed`  | After an entry goes to the trash                               | `trashed_post`           |
| `content.restored` | After an entry comes out of it                                 | `untrashed_post`         |
| `content.deleted`  | After an entry is deleted for good                             | `deleted_post`           |

What the `content.entry` filter returns is checked like any input. The actions run inside the
save's transaction, so what a handler writes is kept or rolled back with the entry, and a handler
that throws is logged without stopping the save.

```ts filename="src/search.ts"
import type { PluginContext } from '@otw/sdk'

/** Keeps a search index of published posts. */
export function indexPosts(cms: PluginContext, index: (id: string, title: string) => void) {
  cms.hooks.addAction('content.saved', ({ entry }) => {
    if (entry.type === 'core.post' && entry.status === 'published') index(entry.id, entry.title)
  })
}
```

## How it differs from WordPress

- **Every type has capabilities of its own**, named after it. WordPress shares posts' unless a
  type sets `capability_type`, and then nobody has them until a plugin adds them to roles, where
  they stay after it's gone.
- **Grants follow the plugin.** A type's `roles` are applied on every start, as other grants are.
- **The body is data, not HTML.** Blocks render through React, so there's no `wp_kses` to
  remember.
- **The trash doesn't loosen checks.** Someone else's entry in the trash is checked by the
  status it had. WordPress asks only `edit_others_posts` there, so a role that may not edit
  published posts could edit one once it's trashed.
- **Slugs are unique in the database**, not only in PHP, so two saves at once can't share one.
- Not yet: scheduled posts and emptying the trash after 30 days, which need a job queue, and
  custom statuses.
