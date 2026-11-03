---
title: Your own pages
description: Add pages to the site with Next.js, and write the site's own home page.
order: 2
---

Any page a site needs that no plugin provides, it adds itself, as a Next.js page under
`src/app/(site)/`. It renders inside the site's layout, like plugin pages.

```tsx filename="src/app/(site)/about/page.tsx"
import { getKernel } from '@otwdesign/next/site'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'About us' }

export default async function About() {
  const kernel = await getKernel()
  return (
    <article>
      <h1>About {kernel.setting('site.title') ?? 'us'}</h1>
      <p>We have been making mugs by hand since 2009.</p>
    </article>
  )
}
```

The site's pages win over plugin pages at the same address, because Next.js matches specific
routes before the CMS's catch-all.

## The home page

Without a page of its own, the site's home page is the CMS's: whatever an active plugin puts at
`/`, or else what Settings › Reading chooses, the latest posts or a static page, in the site's
[templates](/themes/templates). To write your own, replace
`src/app/(site)/page.tsx` with your page, without the `@generated` line at the top; the CMS then
leaves it alone.

```tsx filename="src/app/(site)/page.tsx"
import { getKernel } from '@otwdesign/next/site'
import type {} from '@otwdesign/plugin-commerce'
import Link from 'next/link'

export default async function Home() {
  const kernel = await getKernel()
  const title = kernel.setting('site.title') ?? 'My Site'
  if (!kernel.isActive('commerce')) return <h1>{title}</h1>

  const commerce = kernel.service('commerce')
  const products = (await commerce.listProducts()).slice(0, 3)
  return (
    <>
      <h1>{title}</h1>
      <h2>New in the shop</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <Link href={kernel.url('commerce.product', { slug: product.slug })}>
              {product.title}
            </Link>{' '}
            {commerce.formatMoney(product.price)}
          </li>
        ))}
      </ul>
    </>
  )
}
```

Checking `isActive()` first keeps the page working when the shop is switched off.

## Moving plugin pages

Plugins give their pages paths, such as Commerce's `/product/:slug`. A site can move them, without
touching the plugin, with `routes` in `cms.config.json`, by each page's qualified name:

```json filename="cms.config.json"
{
  "plugins": ["@otwdesign/plugin-commerce"],
  "routes": {
    "commerce.product": "/p/:slug",
    "commerce.shop": "/store"
  }
}
```

Restart `npm run dev`, or rebuild, to apply it. Then:

- The page answers at its new path only, and links that plugins build with
  `cms.routes.url()`, and the site with `kernel.url()`, follow it.
- The new path must keep the page's parameters (`:slug` above). If it doesn't, the plugin that
  owns the page fails to load, and the Plugins screen says why.
- A name that matches no page, such as a typo, is a warning on the Dashboard.
- `/admin`, `/api` and `/_next` can't be used.

`cms generate` checks the names and paths when the site starts or builds. Commerce's pages are
`commerce.shop`, `commerce.product` and `commerce.order-received`.
