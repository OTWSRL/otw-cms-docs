---
title: Layout and styles
description: The site's root layout, its header, navigation and footer, page titles, and the stylesheet.
order: 1
---

## The layout

`src/app/(site)/layout.tsx` is the root layout of every page on the site, the CMS's storefront
pages and plugin pages included. A new site's is short:

```tsx filename="src/app/(site)/layout.tsx"
import { getCurrentUser, getKernel, Slot } from '@otw/next/site'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import '@/cms/site.generated'
import '../globals.css'

// Every page depends on the database and the active plugins, so nothing is prerendered at build.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const site = (await getKernel()).setting('site.title') ?? 'My Site'
  return { title: { default: site, template: `%s · ${site}` } }
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [kernel, user] = await Promise.all([getKernel(), getCurrentUser()])
  return (
    <html lang={kernel.setting('site.locale') || 'en'}>
      <body>
        <header className="site-header">
          <Link href="/" className="site-title">
            {kernel.setting('site.title') ?? 'My Site'}
          </Link>
          <nav aria-label="Main">
            <Slot name="header.nav" />
            {kernel.can(user, 'core.access_admin') && <Link href="/admin">Admin</Link>}
          </nav>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  )
}
```

What it does, line by line:

- **`import '@/cms/site.generated'`** registers the site's plugins for this part of the app.
  Keep it in the layout.
- **`dynamic = 'force-dynamic'`** renders pages on each request, because they read the database:
  settings, plugins and the signed-in user can change at any time.
- **`generateMetadata`** makes the browser tab read "Shop · My Site" on a plugin's Shop page:
  plugins give the `%s`, the site title fills the rest.
- **`<Slot name="header.nav" />`** is where plugins add links to the main navigation, such as
  the shop's.
- **The Admin link** shows only to people who can use the admin.

Change anything else: add a footer, a logo, a second navigation, fonts. It's the site's file.

## Styles

`src/app/globals.css` is imported by the layout, so it styles every page on the site. The admin
has its own root layout and stylesheet, so nothing here reaches it, and its styles never reach the
site.

Plugin pages come with plain, semantic markup and class names; style them from `globals.css`.
To see a plugin's class names, view the page's source in the browser.

Next.js's other styling options work too: CSS Modules for the site's own components, Tailwind,
or any other. See the [Next.js documentation](https://nextjs.org/docs/app/getting-started/css).

## The language

`<html lang>` comes from **Settings › General › Locale**, so screen readers pronounce the site
correctly. Keep it.
