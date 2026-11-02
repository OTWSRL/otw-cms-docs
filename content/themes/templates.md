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
| `thumbnail`        | Its featured image, or `null`                                    |
| `media`            | The images in its body, by id, for `<Blocks media={media} />`    |

**A list's** (`ArchiveTemplateProps`): `title` and `description`, `type`, `taxonomy` and `term`
for a term's archive, `items` (each `{ entry, url, thumbnail }`), and `page`, `pages`, `total`
and `pageUrl(page)` for paging. Settings › Reading sets how many entries a page lists.

`Blocks` renders a body; pass it `media` and its images get their sizes, and an image whose file
was deleted isn't shown. `excerptOf(entry)` gives the excerpt, or the body's first 55 words, as
WordPress makes one. These, `Image` and the default `EntryTemplate` and `ArchiveTemplate` come
from `@otw/next/site`.

## Images

`Image` shows a file from the media library as `wp_get_attachment_image()` does: the size asked
for (`large` unless you say: `thumbnail`, `medium`, a plugin's, or `full`), with its width and
height so the page doesn't jump, and every size of the same shape in `srcset`, so a phone loads a
smaller file. It's lazy unless it's `priority`, as the first image a visitor sees should be:

```tsx filename="src/cms/templates.tsx"
import { Blocks, Image } from '@otw/next/site'
import type { SiteTemplates } from '@otw/next'

const templates: SiteTemplates = {
  single: {
    // Posts with their featured image across the top, as a banner.
    'core.post': ({ entry, thumbnail, media }) => (
      <article>
        {thumbnail && <Image item={thumbnail} size="full" sizes="100vw" priority />}
        <h1>{entry.title}</h1>
        <Blocks blocks={entry.body} media={media} />
      </article>
    ),
  },
}

export default templates
```

## Styling the defaults

The default templates use class names for the site's CSS: `entry`, `type-core-post`,
`status-published`, `entry-title`, `entry-meta`, `entry-content`, `entry-terms` and
`entry-preview` on an entry, with `entry-thumbnail` around its featured image and
`wp-block-image` around each image in the content; `archive`, `archive-title`, `archive-item`,
`archive-thumbnail`, `entry-excerpt` and `pagination` on a list.
