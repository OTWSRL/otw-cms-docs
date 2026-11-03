---
title: Media
description: Upload files to the media library from a plugin, find them, add image sizes, and keep uploads somewhere other than the disk, as WordPress's attachments and add_image_size() do.
order: 3
---

The media library holds a site's uploads: images, PDFs, audio and video, office files. It's
WordPress's attachments, through `cms.media`. People use it at **Media**; a plugin uploads, finds
and changes files with the same calls the screens use.

## What a file is

Each upload is a `MediaItem`:

| Field                                    | What it is                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `url`                                    | Where it's served: `/uploads/2026/11/beach.jpg` on the site's own storage                         |
| `file`                                   | Its storage key, `2026/11/beach.jpg`                                                              |
| `filename`                               | Its name as uploaded, `Beach.JPG`                                                                 |
| `mimeType`, `kind`                       | Its type, and the library's kind: `image`, `audio`, `video`, `document`, `spreadsheet`, `archive` |
| `size`                                   | In bytes                                                                                          |
| `width`, `height`                        | An image's, or `null`                                                                             |
| `sizes`                                  | An image's sizes by name, each with its `url`, `width` and `height`                               |
| `originalFile`, `originalUrl`            | The image as uploaded, when it was bigger than 2560 pixels and was scaled down                    |
| `title`, `alt`, `caption`, `description` | What people write about it; `alt` is the image's alternative text                                 |
| `authorId`, `entryId`                    | Who uploaded it, and the entry it was uploaded to, like an attachment's parent                    |

## Uploading

`upload()` takes the file's name and its bytes, as `media_handle_upload()` does:

```ts filename="src/covers.ts"
import type { PluginContext } from '@otwdesign/sdk'
import { MediaError } from '@otwdesign/sdk'

/** Adds a course's cover from a form's file, uploaded to the course. `null` if it's not allowed. */
export async function addCover(cms: PluginContext, courseId: string, file: File, userId: string) {
  try {
    const cover = await cms.media.upload(
      { name: file.name, data: new Uint8Array(await file.arrayBuffer()) },
      { by: userId, entryId: courseId, alt: 'Course cover' },
    )
    return cover.sizes.medium?.url ?? cover.url
  } catch (error) {
    if (error instanceof MediaError && error.code === 'file_type') return null
    throw error
  }
}
```

What an upload checks and does:

- **Its type**, by extension, from the [allowed list](#file-types), then **its contents**: a PDF
  must start like a PDF and an image must decode, so a page or a program can't come in under a
  harmless name. An image whose extension is wrong (a PNG named `.jpg`) is renamed, as WordPress
  does.
- **Its size**, against the server's limit, 64 MB unless
  [`CMS_MAX_UPLOAD_MB`](/hosting/environment-variables#cms_max_upload_mb) says.
- **Its name**: made safe, in lower case, `Beach Day.JPG` becomes `beach-day.jpg`, in the month's
  folder, `2026/11/`. A name that's taken gets a number, `beach-day-1.jpg`, and two uploads of
  one name at once get two files.
- **An image's sizes**, made from it straight away.

`MediaError` says what went wrong, in a message you can show the person who uploaded: its `code`
is `file_type`, `too_large`, `invalid_input` or `not_found`.

## Finding files

`list()` takes a query, and returns a page of files, newest first, with the total:

| Option             | What it does                                                      |
| ------------------ | ----------------------------------------------------------------- |
| `kind`             | `image`, `audio`, `video`, `document`, `spreadsheet` or `archive` |
| `entryId`          | Files uploaded to an entry; `null` for unattached files           |
| `authorId`         | One person's uploads                                              |
| `search`           | Every word in the title or the file name                          |
| `month`            | `2026-11`: uploaded that month                                    |
| `orderBy`, `order` | `date` (the default, newest first) or `title`                     |
| `limit`, `offset`  | Up to 100 a page; 20 unless you say                               |

```ts filename="src/gallery.ts"
import type { MediaItem, PluginContext } from '@otwdesign/sdk'

/** A course's images, oldest first, for its gallery. */
export async function gallery(cms: PluginContext, courseId: string): Promise<MediaItem[]> {
  const { items } = await cms.media.list({
    entryId: courseId,
    kind: 'image',
    order: 'asc',
    limit: 100,
  })
  return items
}
```

`get(id)` finds one, `getMany(ids)` several in one query, `update(id, changes)` changes its title,
alt text, caption, description or entry, and `delete(id)` deletes it with all its files.

## Image sizes

Every image gets WordPress's sizes, never bigger than the image itself:

| Size           | Default                                      | Set in           |
| -------------- | -------------------------------------------- | ---------------- |
| `thumbnail`    | 150 × 150, cropped                           | Settings › Media |
| `medium`       | Within 300 × 300                             | Settings › Media |
| `medium_large` | 768 wide                                     |                  |
| `large`        | Within 1024 × 1024                           | Settings › Media |
| `1536x1536`    | Within 1536 × 1536, for high-density screens |                  |
| `2048x2048`    | Within 2048 × 2048, for high-density screens |                  |

An image above 2560 pixels is scaled down to 2560 for the site, as WordPress's
`big_image_size_threshold`, and the original is kept beside it. Sizes are turned upright by the
photo's EXIF orientation and keep none of its metadata, such as where it was taken. A plugin adds
its own with `imageSize()`, like `add_image_size()`; it's named under the plugin:

```ts filename="src/index.ts"
import { definePlugin } from '@otwdesign/sdk'

export default definePlugin({
  id: 'lms',
  version: '1.0.0',
  setup(cms) {
    // Course cards: exactly 400 by 225, cropped from the center. Named lms.card.
    cms.media.imageSize('card', { width: 400, height: 225, crop: true })
  },
})
```

Sizes are made when an image is uploaded. Images uploaded before a size was added, or before
Settings › Media changed, keep the sizes they had.

## File types

| Kind          | Extensions                                                                     |
| ------------- | ------------------------------------------------------------------------------ |
| `image`       | jpg, jpeg, png, gif, webp, avif                                                |
| `audio`       | mp3, m4a, aac, wav, ogg, flac                                                  |
| `video`       | mp4, m4v, mov, webm, ogv, 3gp                                                  |
| `document`    | pdf, doc, docx, odt, rtf, txt, srt, vtt, ics, ppt, pptx, ppsx, odp, key, pages |
| `spreadsheet` | xls, xlsx, ods, numbers, csv, tsv                                              |
| `archive`     | zip, gz, tar, 7z, rar                                                          |

It's WordPress's list for people without `unfiltered_html`: never HTML, SVG, JavaScript or
programs. The `media.mimes` filter changes it, like `upload_mimes`. Removing a type is safe;
a type you add is checked by its extension only, so add only types that can't run in a browser:

```ts filename="src/types.ts"
import type { PluginContext } from '@otwdesign/sdk'

const ARCHIVES = new Set(['zip', 'gz|gzip', 'tar', '7z', 'rar'])

/** Markdown files, and no archives. Keys are extensions, as `jpg|jpeg|jpe`. */
export function setTypes(cms: PluginContext) {
  cms.hooks.addFilter('media.mimes', (mimes) => ({
    ...Object.fromEntries(
      Object.entries(mimes).filter(([extensions]) => !ARCHIVES.has(extensions)),
    ),
    md: 'text/markdown',
  }))
}
```

## Hooks

| Action           | When                                                      | Like WordPress's     |
| ---------------- | --------------------------------------------------------- | -------------------- |
| `media.uploaded` | A file was added, in the upload's transaction             | `add_attachment`     |
| `media.updated`  | Its details changed, with `previous`                      | `attachment_updated` |
| `media.deleted`  | It was deleted; its files go once the transaction commits | `delete_attachment`  |

## Who may

| Capability          | What it allows                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `core.upload_files` | Uploading, and opening the library: Authors, Editors and Administrators, as `upload_files`        |
| `core.edit_media`   | A meta capability: one's own files with `core.edit_posts`, anyone's with `core.edit_others_posts` |
| `core.delete_media` | The same with `core.delete_posts` and `core.delete_others_posts`                                  |

Check them as any meta capability: `cms.auth.can(user, 'core.edit_media', item)`.

## Storage

Uploads are kept on the server's disk, in `.data/uploads` or
[`CMS_UPLOADS_DIR`](/hosting/environment-variables#cms_uploads_dir), and served at `/uploads/…`
with caching headers, byte ranges for video, and nothing that could run: `nosniff`, and a sandbox
for anything a browser might take for a page. A plugin keeps them elsewhere, such as S3, by
providing a `MediaStorage` in `setup()`; only one plugin may. Its methods:

| Method                    | What it does                                                             |
| ------------------------- | ------------------------------------------------------------------------ |
| `create(key, data, type)` | Writes a new file; returns `false` without writing when the key is taken |
| `read(key, range?)`       | The file's bytes as a stream, all or a range, with its size and date     |
| `stat(key)`               | Its size and date, without the bytes                                     |
| `delete(key)`             | Removes it; a missing file isn't an error                                |
| `url(key)`                | Where it's served: `/uploads/…`, or another address, such as a CDN's     |

`create()` must never overwrite: it's how two uploads of one name end up with two files. S3's
conditional writes (`If-None-Match: *`) do it. Storage that keeps files in memory, for a plugin's
tests:

```ts filename="test/memory-storage.ts"
import type { MediaStorage } from '@otwdesign/sdk'

/** Files in a Map, served from /uploads, for tests. */
export function memoryStorage(): MediaStorage {
  const files = new Map<string, { data: Uint8Array; modifiedAt: Date }>()
  return {
    async create(key, data) {
      if (files.has(key)) return false
      files.set(key, { data, modifiedAt: new Date() })
      return true
    },
    async read(key, range) {
      const file = files.get(key)
      if (!file) return null
      const bytes = range ? file.data.subarray(range.start, range.end + 1) : file.data
      return {
        body: new Blob([new Uint8Array(bytes)]).stream(),
        size: file.data.byteLength,
        modifiedAt: file.modifiedAt,
      }
    },
    async stat(key) {
      const file = files.get(key)
      return file ? { size: file.data.byteLength, modifiedAt: file.modifiedAt } : null
    },
    async delete(key) {
      files.delete(key)
    },
    url: (key) => `/uploads/${key}`,
  }
}
```

## In entries

Types with the `thumbnail` feature, as Posts and Pages have, take a featured image: an image's id
in `thumbnailId`, set in the edit screen's **Featured image** box or by `create()` and `update()`.
The block editor's **Image** button puts images in the body. Both choose from the library in the
same picker, with an Upload tab, and attach new uploads to the entry once it's saved.

Templates receive the entry's featured image as `thumbnail`, and the images in its body as
`media`, found in one query; see [Images](/themes/templates#images) for `Image`, which writes
`srcset` from an image's sizes.

## The upload API

`GET /api/p/core/media` lists the library for the picker, 40 files at a time: `kind`, `search`
and `page` from 1, answering `{ items, total, pages }`. `POST /api/p/core/media` takes one file, as a multipart form with the file in `file` and,
optionally, the entry it's for in `entry`. It's what **Media › Add New** sends each dropped file
to, like WordPress's `async-upload.php`, and it acts as the signed-in person, from the site's own
pages only. It answers `201` with the file, or an `{ error }`: `401` signed out, `403` without
`core.upload_files`, `413` too large, `415` a type that isn't allowed, `400` otherwise.

## How it differs from WordPress

- **Files aren't entries.** They have a table of their own, so lists of posts never wade through
  them, and there are no attachment pages (which WordPress turned off by default in 6.4).
- **Every type's contents are checked**, not only images', and uploads are served so that nothing
  in them can run.
- **Names can't collide.** Each file is claimed as it's written, so two uploads at once never
  overwrite each other, and names are lower case, so they can't differ by case alone.
- **Files go after the delete commits**, so a delete that's rolled back leaves them.
- **A deleted image disappears from the site** rather than showing as broken, and a featured
  image's delete clears it from its entries.
- Not yet: editing images (crop, rotate), captions in image blocks, making sizes again after
  they change, custom fields and taxonomies on files, and a trash for media.
