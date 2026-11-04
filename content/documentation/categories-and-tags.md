---
title: Categories and tags
description: Sort posts into categories and label them with tags at Posts › Categories and Posts › Tags, as in WordPress, and what deleting one does.
order: 2.3
---

Posts have **categories** and **tags**, as in WordPress. Categories are the site's broad topics,
and can sit under one another; every post has at least one. Tags are free labels, as many or as
few as a post needs. Pages have neither. Plugins can add their own kinds, such as a course's
topics, and these work the same way.

## Giving a post categories and tags

On a post's edit screen, the **Categories** box lists every category, indented under its parent:
tick the ones that fit. In the **Tags** box, type tags separated by commas. A tag the site
doesn't have yet is added when you save.

A post saved with no category gets **Uncategorized**, as in WordPress.

## Managing them

**Posts › Categories** and **Posts › Tags** list them beside a form to add one:

- **Name**: how it appears on the site. Two categories under the same parent can't share a name.
- **Slug**: the last part of its address. It's made from the name if you leave it empty.
- **Parent Category**, for categories: the one it sits under.
- **Description**: some designs show it on the category's or tag's page.

The **Count** column is how many published posts have each one; click it to see them in the Posts
list. **Search** finds them by name, slug or description. Click a name to edit it, with the same fields, and
**Update**.

## Uncategorized

**Uncategorized** is the default category: it's created the first time a post needs it, and given
to posts that have no other. You can rename it, to "General" say, but its slug stays
`uncategorized`, and it can't be deleted.

## Deleting

**Delete** in a row, **Delete this category** on its screen, or **Delete** in **Bulk actions**
removes a category or tag. The posts stay:

- They lose that category or tag. A post left with no category gets Uncategorized.
- A deleted category's own categories move up to its parent. If one of them has the same name as a
  category already there, the delete is refused: rename it first.

It can't be undone.

## On the site

Each category and tag has a page listing its published posts, newest first, at
`/category/{slug}` and `/tag/{slug}`. A category's page includes posts in the categories under it.
Long lists go on over more pages, as many to a page as
[Settings › Reading](/documentation/settings#settings--reading) says. A post's page shows its
categories and tags, linked to theirs, where the design does. See
[Posts and pages](/documentation/posts-and-pages#on-the-site).

## Who can do what

| Role                          | What they can do                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| **Administrator**, **Editor** | Add, edit and delete categories and tags. Posts › Categories and Posts › Tags are theirs.       |
| **Author**, **Contributor**   | Tick categories and type tags on their posts, new tags included. No Categories or Tags screens. |
| **Customer**                  | No admin access.                                                                                |

Developers add taxonomies of their own; see [Taxonomies](/plugins/content/taxonomies) in the Plugin
Handbook.
