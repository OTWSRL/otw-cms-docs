---
title: The media library
description: Upload images, documents, audio and video at Media, find them again, describe them, and delete them, as in WordPress's Media Library.
order: 2.5
---

**Media** holds the site's files: photos and other images, PDFs, office files, audio and video.
It's WordPress's Media Library. Authors, Editors and Administrators can use it.

## Uploading

**Media › Add New Media File** takes files two ways: drop them on the box, or press **Select
Files** and choose them. Each file uploads straight away, with its progress, and then shows an
**Edit** link. A file that can't be uploaded says why, and the others still go.

- **Up to 64 MB a file**, unless the server sets another limit; the screen shows it.
- **Images, documents, spreadsheets, audio, video and archives**: jpg, png, gif, webp, avif; pdf,
  Word, PowerPoint, Excel, OpenDocument and Apple's iWork files, text and CSV; mp3, m4a, wav, ogg,
  flac; mp4, mov, webm; zip and the like. For safety, never web pages, SVG or programs. A file's
  contents must match its extension.
- **Images get smaller copies** for thumbnails and pages: see [Settings › Media](/documentation/settings#settings--media).
  Photos are turned the right way up, and the copies don't keep where a photo was taken. A photo
  bigger than 2560 pixels is scaled down for the site, and the original is kept.

Without JavaScript, the screen is a plain form: choose the files and press **Upload**.

## The library

**Media › Library** shows every file, as a **Grid** of thumbnails or as a **List** with each file's
uploader, what it was uploaded to, and when. Switch with the links at the top.

- **Filter** by type (Images, Audio, Video, Documents, Spreadsheets, Archives), by **Unattached**
  (uploaded to nothing), by **Mine**, or by month.
- **Search** finds files by title or file name.
- In the list, each file has **Edit**, **Delete Permanently**, **View** and **Download file**.
- To delete several, tick them, choose **Delete permanently** in **Bulk actions**, and press
  **Apply**.

## Editing a file

A file's screen shows it (an image, or a player for audio and video) with what you can write about
it:

- **Title**: the file's name in the library. It starts as the name of the file you uploaded.
- **Alternative Text**, for images: what the image shows, for people who can't see it. Leave it
  empty when the image is only decoration.
- **Caption** and **Description**.

The **Save** box lists when it was uploaded and by whom, what it was uploaded to, its address
(**Copy URL to clipboard** copies it), its file name, type and size, and an image's dimensions.
Press **Update** to save.

## Images in posts and pages

In the editor, press **Image** in the toolbar to put an image in the content: choose one from
**Media Library**, or upload it under **Upload files**, then press **Insert image**. Select the
image in the content to write its **Alternative text**.

Posts and pages also have a **Featured image** box: **Set featured image** chooses one the same
way, a click on the image changes it, and **Remove featured image** takes it off. Save the post
to keep the change. The site shows the featured image at the top of the post, and beside it in
lists of posts.

Images go on the site at the size that fits: phones load a smaller copy than wide screens do.

## Deleting

**Delete permanently** removes the file and every copy of it, at once: there's no trash for media,
as in WordPress. Posts and pages that show the image stop showing it, and lose it as their
featured image, so check first.

## Who can do what

| Role                          | Uploads | Edits and deletes       |
| ----------------------------- | ------- | ----------------------- |
| **Administrator**, **Editor** | Yes     | Everyone's files        |
| **Author**                    | Yes     | Their own files         |
| **Contributor**, **Customer** | No      | The library isn't shown |
