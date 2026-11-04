---
title: Posts and pages
description: Write, publish and organise the site's posts and pages in the block editor, send drafts for review, compare and restore revisions, and see where each one appears on the site.
order: 2.2
---

The site's content is **posts** and **pages**, as in WordPress. Posts are dated news, articles
and the like, listed newest first, with [categories and tags](/documentation/categories-and-tags).
Pages are the site's standing pages, such as About or Contact, and can sit under one another.
Plugins add types of their own, such as courses, and these work the same way.

**Posts › All Posts** and **Pages › All Pages** list them, and **Add New Post** and **Add New
Page** start one.

## The lists

Each list shows 20 at a time, with each one's title, author and date, plus categories and tags
for posts. A post that isn't published says so after its title: **— Draft**, **— Pending** or
**— Private**.

- **Views** above the list count each status: **All**, **Mine** (yours, when others write too),
  **Published**, **Drafts**, **Pending**, **Private** and **Trash**. A status with nothing in it
  isn't shown.
- **Search** finds entries whose title, excerpt or content has every word you type, at the start
  of a word: `photo` finds "photography".
- **Filter** by month, and posts by category, with the dropdowns above the list and **Filter**.
  Click an author's name or a category in a row to show only theirs.
- **Sort** by title or date with the column headings.
- **Pages show as a tree**, each under its parent with a dash per level, until you sort, search
  or filter.

Each row has its actions under the title: **Edit**, **Trash**, and **View** for one that's
published or **Preview** for one that isn't. Plugins can add their own. To move several
to the Trash, tick them, choose **Move to Trash** in **Bulk actions**, and press **Apply**: up
to 100 at a time. Any you may not change are skipped, and the message says how many.

## Writing

The edit screen is WordPress's: the title and content on the left, boxes on the right.

- **Title**: once it's published, the address shows under it as **Permalink**.
- **Content**: the block editor. Its toolbar turns the current block into a paragraph, one of six
  heading levels or code, and has bold, italic, strikethrough, inline code, links, bulleted and
  numbered lists, quotes, a separator and images, with undo and redo. Links may go to web pages,
  email addresses and other pages on the site. For images, see
  [Images in posts and pages](/documentation/media#images-in-posts-and-pages).
- **Excerpt**, for posts: a short summary for lists and search results. The site uses it as the
  page's description for search engines too.
- **Slug**: the last part of the address. It's made from the title when the entry is published,
  unless you set one, and it changes with the title until then. If another post already has it, a
  number is added: `hello-world-2`.
- **Author**, for those who may edit others' entries: whose it is. Anyone whose role may write
  that kind of entry can be chosen.
- **Featured image**: see [The media library](/documentation/media#images-in-posts-and-pages).
- **Categories** and **Tags**, for posts. Tick categories; type tags separated by commas. See
  [Categories and tags](/documentation/categories-and-tags).

Plugins add boxes of their own, such as a course's hours, in either column.

The editor needs JavaScript. Without it, the other fields still save and the content stays as it
was.

**Nothing is lost if a save fails.** The browser tab keeps your title, excerpt and content until
the entry is saved. If a save doesn't go through, or the tab is reloaded first, the editor says
"This browser kept changes that weren't saved", with **Restore them** and **discard them**. There's
no autosave yet: save to keep your work.

## Publishing

The **Publish** box at the top of the right column holds:

- **Save Draft**, to save without publishing.
- **Preview**, which opens the saved entry as the site will show it, in a new tab. Save first: it
  shows what was last saved. Once the entry is published, this is **View Post** or **View Page**.
- **Status**: **Draft** or **Pending Review**, and **Published** once it is.
- **Visibility**: **Public**, or **Private** for the people who may read private entries; see
  [On the site](#on-the-site). It's shown only to those who may publish.
- **Revisions**, once there are two or more; see [Revisions](#revisions).
- **Publish** (or **Update**, once it's published) and **Move to Trash**.

Publishing happens at once: there's no scheduling for later yet. The message at the top says what
happened: "Post published.", "Post published privately.", "Post draft updated.", "Post updated."

To take something off the site, set **Status** to **Draft** and press **Update**.

### Sending posts for review

Contributors can write posts but not publish them. Their button says **Submit for Review**, which
saves the post as **Pending**: "Post submitted." An Editor or Administrator finds it under
**Pending**, edits it if needed, and presses **Publish**. Once it's published, the contributor can
no longer change it.

## Page Attributes

Pages have a **Page Attributes** box:

- **Parent**: the page this one sits under. Its address follows: a page `team` under `about` is
  at `/about/team`. A page can't be under itself or one of its own children.
- **Order**: where it goes among the pages beside it in the tree, lowest first. Pages with the
  same number go by title.

## When someone else saved first

If two people edit the same entry, the second save is refused rather than overwriting the first:
"This changed after you opened it, so your changes were not saved." The screen reloads with the
other person's version, and the editor offers your changes back. Restore them, check them against
the other person's, and save again.

## Revisions

Posts and pages keep a **revision** each time a save changes the title, the content, the excerpt
or a plugin's fields. A save that only changes the status keeps none. Each one keeps its 25 latest
revisions; older ones are let go.

Once there are two, the Publish box shows **Revisions** with **Browse**. The screen lists them
newest first, each with its date and who saved it; the newest is marked **(current)**. Choose one
to see what it changed from the one before, field by field: removed lines marked −, added ones +.

**Restore This Revision** puts the entry back as that revision had it: "Post restored to the
revision from…". Restoring is itself a save, so it adds a revision, and nothing is lost: you can
go back again. Anyone who may edit the entry can restore it.

## The Trash

**Move to Trash** takes an entry off the site and puts it in the list's **Trash** view, as in
WordPress. It stays there until someone deletes it: nothing empties the Trash by itself.

- **Restore** brings it back as a **Draft**, whatever it was before. Publish it again to put it
  back on the site.
- **Delete Permanently** removes it with its revisions. It can't be undone. A deleted page's child
  pages move up to its parent.
- **Empty Trash** deletes everything in that list's Trash that you may delete.

An entry in the Trash can't be edited; its edit screen offers **Restore**. Files it used stay in
the [media library](/documentation/media).

## On the site

Every published post and page has its own address, as WordPress's "Post name" permalinks give
them:

| What                        | Address                                     |
| --------------------------- | ------------------------------------------- |
| A page                      | Its slug, after its parents': `/about/team` |
| A post                      | Its slug: `/hello-world`                    |
| A category's or tag's posts | `/category/news`, `/tag/recipes`            |
| A plugin's entry            | Under the type's name: `/course/basics`     |

Pages come first: if a page and a post have the same slug, the page shows. A page under a parent
that isn't published has no address until the parent is. A developer can move posts and the
others, such as to `/blog/hello-world`; see
[On the site](/plugins/content#on-the-site) in the Plugin Handbook.

**Who sees what:**

- **Published**: everyone.
- **Private**: only people who are signed in and may read it: its author, Editors and
  Administrators. Everyone else gets "page not found".
- **Draft** and **Pending**: nobody, except through **Preview**, for its author and those who may
  edit it.
- **In the Trash**: nobody.

A preview is the entry's saved version at `/?preview=` and its id. Search engines are told to
skip previews and private entries.

**The home page** lists the latest posts, unless **Settings › Reading** makes it a page of your
choice, with another page for the list of posts. See
[Settings › Reading](/documentation/settings#settings--reading). Lists of posts go on over more
pages, as many to a page as that setting says.

How each of these looks is up to the site's design; see [Templates](/themes/templates).

## Who can do what

| Role                          | Posts                                                                         | Pages      |
| ----------------------------- | ----------------------------------------------------------------------------- | ---------- |
| **Administrator**, **Editor** | Everyone's: write, publish, edit, trash and delete, private ones included     | Everyone's |
| **Author**                    | Their own: write, publish, and edit or trash them after they're published     | Not shown  |
| **Contributor**               | Their own: write drafts and submit them for review; no changes once published | Not shown  |
| **Customer**                  | No admin access                                                               | No         |

Roles and what they may do are on [Users and roles](/documentation/users-and-roles). Plugins'
types say which roles may write them.
