---
title: Content types
description: Register content types and work with their entries, as WordPress's register_post_type() and wp_insert_post() do, with capabilities for own, others' and published entries.
order: 7.5
---

Content types are WordPress's post types: the CMS's Posts and Pages, and a plugin's courses,
lessons or recipes. Their entries are WordPress's posts. Every type's entries share one table and
one set of rules for statuses, slugs, authors and capabilities, so a plugin gets them by
registering a type.

A type with screens gets WordPress's list and edit screens in the admin, with the block editor,
and the menu entries to reach them; see [Screens](#screens). [Taxonomies](/plugins/content/taxonomies)
classify entries, as categories and tags do, and [custom fields](/plugins/content/meta) give
them typed values of their own.

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
| `showUi`       | It has list and edit screens in the admin. Defaults to `public`, as WordPress's `show_ui`.                                  |
| `showInMenu`   | Its screens are in the menu, in the plugin's section. Defaults to `showUi`.                                                 |
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

| Method                                | Like WordPress's                       | Does                                                                                        |
| ------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------- |
| `create(type, fields)`                | `wp_insert_post()`                     | Adds an entry. Every field is optional: it starts as an untitled draft.                     |
| `update(id, changes)`                 | `wp_update_post()`                     | Changes the fields given. An entry in the trash must be restored first.                     |
| `get(id)`                             | `get_post()`                           | The entry, or `null`.                                                                       |
| `getBySlug(type, slug, { parentId })` | `get_page_by_path()`                   | The published or private entry with that slug, at the top or under a parent.                |
| `list(query)`                         | `WP_Query`                             | A page of entries and how many match: by type, status, author, parent, ids, search or date. |
| `count(type, { authorId })`           | `wp_count_posts()`                     | How many entries have each status, everyone's or one author's.                              |
| `months(type)`                        | The "All dates" filter                 | The months that have entries, newest first.                                                 |
| `trash(id)`, `restore(id)`            | `wp_trash_post()`, `wp_untrash_post()` | Into the trash, and back out as a draft.                                                    |
| `delete(id)`                          | `wp_delete_post()`                     | Deletes for good. Its children move up to its parent.                                       |

`list()` returns everything but the trash unless asked, newest first by WordPress's post date
(when it was published, or created if it never was). It also orders by `updated`, `title` and
`position`, 20 to a page and at most 100. `search` finds every word in the title, excerpt or
body's text; `after` and `before` bound the date. `orderBy: 'tree'` lists a hierarchical type as
WordPress lists pages, parents before their children, and returns each entry's depth in `depths`.

Entries have a `title`, an `excerpt`, a `body`, an `authorId`, a `parentId`, a `position` for
ordering by hand (WordPress's `menu_order`), and `publishedAt`, set when the entry is first
published. A date in the past backdates it; one in the future is refused until scheduling comes.
The `body` is a list of blocks, stored as JSON and rendered by React components, so stored content
can't add markup of its own; see [The body](#the-body). Bad input throws a `ContentError` whose
message is safe to show.

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

## The body

An entry's body is the block editor's document: ProseMirror's JSON, a list of blocks. Every save
is checked against the blocks the editor offers and rebuilt from what they allow, so a forged
form can't store anything else.

| Block     | JSON                                                                        |
| --------- | --------------------------------------------------------------------------- |
| Paragraph | `{ "type": "paragraph", "content": [text] }`                                |
| Heading   | `{ "type": "heading", "attrs": { "level": 2 }, "content": [text] }`         |
| Lists     | `bulletList` and `orderedList` (`attrs.start`), holding `listItem` blocks   |
| Quote     | `{ "type": "blockquote", "content": [blocks] }`                             |
| Code      | `{ "type": "codeBlock", "attrs": { "language": "ts" }, "content": [text] }` |
| Separator | `{ "type": "horizontalRule" }`                                              |

Text is `{ "type": "text", "text": "…", "marks": […] }`, with `bold`, `italic`, `strike`, `code`
and `link` marks, and `{ "type": "hardBreak" }` for a line break. Links may only go to `http`,
`https` and `mailto` addresses, or paths on the site: `isSafeHref()` is the check, in the editor,
on save and when the body is shown.

On the site, the `Blocks` component from `@otw/next/site` renders a body. It's a server
component, so it sends the browser no JavaScript:

```tsx filename="src/course-page.tsx"
import type { Entry } from '@otw/sdk'
import { Blocks } from '@otw/next/site'

export function CoursePage({ course }: { course: Entry }) {
  return (
    <article>
      <h1>{course.title}</h1>
      <Blocks blocks={course.body} />
    </article>
  )
}
```

## Screens

A type with `showUi` gets WordPress's screens: Posts are at `/admin/posts`, and a plugin's type
under the plugin, as `/admin/lms/courses`. "All Courses" and "Add New Course" come first in the
plugin's section of the menu. Each needs the type's `edit` capability, and an entry's edit screen
its `edit_` meta capability on that entry.

- **The list** (`edit.php`) has views by status with their counts, Mine, a search box, the month
  filter, sorting by title or date, and pages of 20. Pages and other hierarchical types are
  listed as a tree. Row actions are Edit and Trash, or Restore and Delete Permanently in the
  trash; bulk actions move to the trash, restore and delete, and Empty Trash clears it. Every
  action is checked against each entry, whatever the screen offered.
- **The edit screen** (`post.php`) has the title, the block editor, Excerpt, Slug and Author in
  the main column, and the Publish box and Page Attributes in the sidebar. Contributors get
  Submit for Review instead of Publish; changing the author needs `edit_others_`. An entry is
  created on its first save, so an abandoned Add New leaves nothing behind.
- **Saving over someone else's change** is refused: the form carries the entry's `updatedAt`,
  and the save checks it. Nothing typed is lost: the editor keeps the title, excerpt and body in
  the browser until they're saved, and offers them back, as WordPress's backup does.

The editor's code is fetched only on edit screens: the other screens don't download it.

## Columns, boxes and actions

A plugin adds to any type's screens from its [admin entry](/plugins/admin): one type's, several,
or every type's with `'*'`.

```tsx filename="src/admin.tsx"
import { defineAdmin } from '@otw/sdk'
import lms from './index'

declare module '@otw/sdk' {
  interface Capabilities {
    'lms.archive_courses': true
  }
}

export default defineAdmin(lms, (cms) => {
  // Like manage_{$post_type}_posts_columns. load() runs once for the page of entries shown.
  cms.admin.column('lms.course', {
    name: 'words',
    label: 'Words',
    after: 'title',
    load: (entries) => new Map(entries.map((entry) => [entry.id, entry.excerpt.split(' ').length])),
    render: (entry, words) => words.get(entry.id) ?? 0,
  })

  // Like add_meta_box(). Its fields are part of the entry's form.
  cms.admin.metaBox('lms.course', {
    name: 'level',
    title: 'Level',
    context: 'side',
    component: () => (
      <select name="lms.level" aria-label="Level">
        <option>Beginner</option>
        <option>Advanced</option>
      </select>
    ),
    async save({ entry, form }) {
      // Keep it in the plugin's own table; typed entry meta is on the way.
      cms.logger.info('Course level saved', { course: entry.id, level: form.get('lms.level') })
    },
  })

  cms.admin.rowAction('lms.course', {
    name: 'lessons',
    link: (entry) => ({ label: 'Lessons', url: cms.admin.url('/lessons') + `?course=${entry.id}` }),
  })

  cms.admin.bulkAction('lms.course', {
    name: 'archive',
    label: 'Archive',
    capability: 'lms.archive_courses',
    handler: ({ entries }) => `${entries.length} courses archived.`,
  })
})
```

- **`column(types, { name, label, after, load, render })`**: `load` gets the page of entries
  and returns what `render` needs for each, so a list costs one query per column, not one per
  row as WordPress's `manage_posts_custom_column` invites. `after` names the column it follows
  (`title`, `author`, or another plugin's `pluginId.name`); by default it goes before the date.
- **`metaBox(types, { name, title, context, order, component, save })`**: `component` receives
  the entry (`null` on Add New), the type and the user. `save` runs once the entry is written,
  in the same transaction, like a `save_post` handler; throw `ActionError` to refuse the save
  with a message. Name fields after your plugin, as `lms.level`, so they don't clash.
- **`rowAction(types, { name, link })`**: a link under each entry's title; return `null` to leave
  it out for an entry or user.
- **`bulkAction(types, { name, label, capability, handler })`**: a choice in Bulk actions. The
  CMS checks `capability`; the handler gets the selected entries and returns the notice.

Register them in the admin entry: the screens are the admin's, so their code stays out of the
site's pages.

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
- **Columns load once per page**, not once per row.
- **No edit locks; stale saves are refused instead**, and what was typed waits in the browser.
- Not yet: scheduled posts and emptying the trash after 30 days, which need a job queue, and
  custom statuses.
