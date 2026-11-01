---
title: Theme Handbook
description: Change how an OTW CMS site looks. Its layout and styles, its own pages, and how plugin pages fit into them.
---

In WordPress, a theme decides how a site looks: its header and footer, its styles, the templates
for its pages. In OTW CMS that's the job of the site's own Next.js files. The site **is** the
theme: its layout wraps every page, its stylesheet styles them, and any page it adds is a Next.js
page with full access to the CMS.

## What's the site's, and what's the CMS's

A site created with `create-otw-cms` owns these files, which the CMS never touches:

| File                         | Like WordPress's              | See                                            |
| ---------------------------- | ----------------------------- | ---------------------------------------------- |
| `src/app/(site)/layout.tsx`  | `header.php` and `footer.php` | [Layout and styles](/themes/layout-and-styles) |
| `src/app/globals.css`        | `style.css`                   | [Layout and styles](/themes/layout-and-styles) |
| `src/app/(site)/**/page.tsx` | Page templates                | [Your own pages](/themes/pages)                |
| `next.config.ts`             | Parts of `wp-config.php`      | [Hosting](/hosting)                            |

The rest of `src/app` is written by the CMS, and the admin has a layout of its own, so a site's
styles never leak into the admin. See [Files the CMS manages](/themes/managed-files).

## Plugin pages wear the site's layout

Pages that plugins add, such as a shop's product pages, render inside the site's layout. Change
the layout and the stylesheet, and they change with it. A plugin's markup is its own, though:
style it from `globals.css` with the plugin's class names.

## What a theme can use

Pages and layouts are React Server Components, so they read straight from the CMS: settings, the
signed-in user, capability checks, plugin services, and slots where plugins add links and
widgets. See [Using the CMS in your pages](/themes/cms-data).

## What's coming

Themes as packages, which a site installs and switches the way it does plugins, and overriding a
plugin's components from the theme, are on the roadmap. Until then, a site's design lives in the
site, and a reusable design is a starter site to copy.
