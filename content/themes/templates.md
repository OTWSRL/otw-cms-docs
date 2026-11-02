---
title: Templates
description: Choose how the site shows posts, pages and archives, as a WordPress theme's single.php and archive.php do.
order: 2.5
---

Posts, pages and other content render in templates: one for an entry, one for a list of them (an
archive). The CMS has plain default templates, styled by the site's CSS. A site replaces any of
them with its own, as a WordPress theme's `single.php` and `archive.php` replace the defaults.

## Which template a page gets

| View      | Shows                                                   | Like WordPress's          |
| --------- | ------------------------------------------------------- | ------------------------- |
| `single`  | One entry: a post, a page, a course                     | `single.php`, `page.php`  |
| `archive` | A type's entries, and the latest posts on the home page | `archive.php`, `home.php` |
| `term`    | A term's entries: a category, a tag                     | `category.php`, `tag.php` |

For each, the site's own template wins, then a plugin's, then the CMS's default, as a theme's
templates win over a plugin's in WordPress.

## The site's templates

Put them in `src/cms/templates.tsx`, by view, then by content type or taxonomy, or `*` for every
one. `cms generate` finds the file and adds it to the site's module.

```tsx filename="src/cms/templates.tsx"
import { Blocks, EntryTemplate } from '@otw/next/site'
import type { SiteTemplates } from '@otw/next'

const templates: SiteTemplates = {
  single: {
    // Pages without a date or author, and a wider column.
    'core.page': ({ entry }) => (
      <article className="page-wide">
        <h1>{entry.title}</h1>
        <Blocks blocks={entry.body} />
      </article>
    ),
    // Posts as the default shows them, with a sign-off.
    'core.post': (props) => (
      <>
        <EntryTemplate {...props} />
        <p className="sign-off">Thanks for reading.</p>
      </>
    ),
  },
}

export default templates
```

## What templates receive

**An entry's** (`EntryTemplateProps`):

| Prop               | What it is                                                       |
| ------------------ | ---------------------------------------------------------------- |
| `entry`            | The entry, with its `body` for `Blocks` and its custom fields    |
| `type`             | Its content type                                                 |
| `url`              | Its address, or `null` for a draft in preview                    |
| `author`           | `{ id, name }`, or `null`. Never the email address               |
| `terms`, `termUrl` | Its terms in its type's public taxonomies, and their addresses   |
| `preview`          | Whether it's shown to someone who may read it before it's public |

**A list's** (`ArchiveTemplateProps`): `title` and `description`, `type`, `taxonomy` and `term`
for a term's archive, `items` (each `{ entry, url }`), and `page`, `pages`, `total` and
`pageUrl(page)` for paging. Settings › Reading sets how many entries a page lists.

`Blocks` renders a body; `excerptOf(entry)` gives its excerpt, or its first 55 words, as
WordPress makes one. Both, and the default `EntryTemplate` and `ArchiveTemplate`, come from
`@otw/next/site`.

## Styling the defaults

The default templates use class names for the site's CSS: `entry`, `type-core-post`,
`status-published`, `entry-title`, `entry-meta`, `entry-content`, `entry-terms` and
`entry-preview` on an entry; `archive`, `archive-title`, `archive-item`, `entry-excerpt` and
`pagination` on a list.
