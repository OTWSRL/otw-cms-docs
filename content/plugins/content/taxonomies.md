---
title: Taxonomies
description: Classify entries with terms, as WordPress's register_taxonomy() does, hierarchical like categories or flat like tags, with capabilities, screens and a default term.
order: 1
---

A taxonomy classifies entries: WordPress's categories and tags, or a plugin's course topics and
skill levels. Its terms are the categories, the tags, the topics. The CMS registers WordPress's
two for posts, and plugins add their own.

## Registering a taxonomy

Register taxonomies in `setup()`, after the types they classify. The name is qualified with the
plugin's id, as content types' are, and the two share names: a plugin can't have a type and a
taxonomy both called `topic`. Add it to the `Taxonomies` interface, which types its capability
names.

```ts filename="src/index.ts"
import { definePlugin } from '@otwdesign/sdk'

declare module '@otwdesign/sdk' {
  interface ContentTypes {
    'lms.course': true
  }
  interface Taxonomies {
    'lms.topic': true
  }
}

export default definePlugin({
  id: 'lms',
  version: '1.0.0',
  requires: { core: '^1.0.0' },
  setup(cms) {
    cms.content.type('course', { labels: { singular: 'Course', plural: 'Courses' }, public: true })
    cms.content.taxonomy('topic', {
      labels: { singular: 'Topic', plural: 'Topics' },
      types: ['lms.course'],
      hierarchical: true,
      showAdminColumn: true,
      defaultTerm: { name: 'General' },
    })
  },
})
```

| Field             | What it is                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `labels`          | `singular` and `plural`, such as `Topic` and `Topics`.                                                            |
| `types`           | The content types it classifies. Those no active plugin registers are left out.                                   |
| `hierarchical`    | Terms have parents, as categories do. Otherwise they're flat, as tags are.                                        |
| `plural`          | The plural in its capability names, as for content types: `categories` needs it.                                  |
| `public`          | Its terms get pages on the site. Defaults to `true`, as in WordPress.                                             |
| `showUi`          | A screen in the admin, and boxes on its types' edit screens. Defaults to `public`.                                |
| `showAdminColumn` | A column on its types' list screens, and, for hierarchical taxonomies, a filter. Defaults to `false`.             |
| `defaultTerm`     | The term an entry gets when it has none, such as "Uncategorized". It's created when first needed.                 |
| `roles`           | Which roles get its capabilities. Defaults to WordPress's: editors manage terms; authors and contributors assign. |

`cms.content.taxonomies()` lists the registered taxonomies, or with a type, those classifying it,
and `getTaxonomy(name)` finds one, like WordPress's `get_object_taxonomies()` and `get_taxonomy()`.

## Categories and tags

| Taxonomy        | Kind         | Default term  | Who may add terms                                   |
| --------------- | ------------ | ------------- | --------------------------------------------------- |
| `core.category` | Hierarchical | Uncategorized | Editors, on Posts › Categories                      |
| `core.tag`      | Flat         | None          | Editors on Posts › Tags; authors as they tag a post |

## Capabilities

A taxonomy declares WordPress's four capabilities and three meta ones. For `lms.topic`:

| Capability          | Lets a role                                                                       |
| ------------------- | --------------------------------------------------------------------------------- |
| `lms.manage_topics` | Open the Topics screen                                                            |
| `lms.edit_topics`   | Add and change topics                                                             |
| `lms.delete_topics` | Delete them                                                                       |
| `lms.assign_topics` | Give entries topics; for a flat taxonomy, adding new terms by name while doing so |

`lms.edit_topic`, `lms.delete_topic` and `lms.assign_topic` take a term. As in WordPress, the
default term can't be deleted, by anyone. Core's are WordPress's names: `core.manage_categories`,
`core.assign_tags` and the rest.

## Terms

| Method                                    | Like WordPress's        | Does                                                                     |
| ----------------------------------------- | ----------------------- | ------------------------------------------------------------------------ |
| `createTerm(taxonomy, { name, … })`       | `wp_insert_term()`      | Adds a term. The slug is made from the name unless given.                |
| `updateTerm(id, changes)`                 | `wp_update_term()`      | Changes a term. The default term keeps its slug.                         |
| `deleteTerm(id)`                          | `wp_delete_term()`      | Deletes a term; see below.                                               |
| `getTerm(id)`, `getTermBySlug(tax, slug)` | `get_term()`            | A term, or `null`.                                                       |
| `listTerms(query)`                        | `get_terms()`           | A page of terms with their counts: by parent, ids, search, or as a tree. |
| `entryTerms(entryIds, taxonomy?)`         | `wp_get_object_terms()` | Several entries' terms at once, by entry id.                             |
| `setEntryTerms(entryId, taxonomy, …)`     | `wp_set_object_terms()` | Replaces an entry's terms, by `ids` or by `names`.                       |

- **Slugs** are unique in a taxonomy, numbered from 2 when taken. **Names** are unique among a
  term's siblings, as WordPress refuses a second "News" beside the first.
- **Counts** are published entries, as WordPress counts them, worked out when a list asks. Nothing
  is stored, so they can't drift and saving an entry costs nothing more.
- **Deleting a term** moves its children up to its parent, and entries it leaves with no term of
  the taxonomy get the default term.
- **Setting terms by name** adds any that don't exist, as WordPress does for tags; setting none
  gives the entry the default term.
- An entry saved with no term of a taxonomy that has a default gets it, as WordPress gives posts
  Uncategorized.

`list()` filters entries by terms, a hierarchical taxonomy's terms with their children:

```ts filename="src/news.ts"
import type { PluginContext } from '@otwdesign/sdk'

/** The latest published posts in a category, its subcategories included. */
export async function latestIn(cms: PluginContext, slug: string) {
  const category = await cms.content.getTermBySlug('core.category', slug)
  if (!category) return []
  const { entries } = await cms.content.list({
    type: 'core.post',
    status: 'published',
    terms: { 'core.category': [category.id] },
    limit: 5,
  })
  return entries
}
```

## Screens

- **The taxonomy's screen** (`edit-tags.php`) sits under its first type with screens: Posts ›
  Categories is `/admin/posts/categories`. It has the add form beside the list, with Name,
  Description, Slug and Count columns, search, and bulk delete. Each count links to the entries.
- **A term's screen** (`term.php`) edits its name, slug, parent and description.
- **On the entry's edit screen**, a hierarchical taxonomy is a checklist and a flat one a
  comma-separated field, for those who may assign its terms. The save checks that capability for
  every box the form had.
- **On the list**, a taxonomy with `showAdminColumn` gets a column whose terms link to the entries
  they classify, and a hierarchical one an "All Categories" filter.

## Hooks

| Hook                   | When                                    | Like WordPress's              |
| ---------------------- | --------------------------------------- | ----------------------------- |
| `content.term.saved`   | A term was added or changed             | `created_term`, `edited_term` |
| `content.term.deleted` | A term was deleted                      | `delete_term`                 |
| `content.entry.terms`  | An entry's terms in a taxonomy were set | `set_object_terms`            |

## How it differs from WordPress

- **Counts aren't stored**, so no `_update_post_term_count` and no counts gone wrong.
- **Names and slugs are unique in the database**, not only checked in PHP.
- **The default term is a taxonomy's**, named in its definition, not an option that can point at
  a term that's gone.
- Not yet: term meta, adding a category from the edit screen's box, and term pages on the site.
