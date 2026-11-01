---
title: Using the CMS in your pages
description: Read settings, check who's signed in, call plugin services, link to plugin pages and render slots from the site's layouts and pages.
order: 3
---

Layouts and pages are React Server Components, so they read from the CMS directly. Everything
comes from `@otw/next/site`.

| Import             | What it gives you                                               |
| ------------------ | --------------------------------------------------------------- |
| `getKernel()`      | The site's kernel: settings, capabilities, services, page URLs. |
| `getCurrentUser()` | The signed-in user for this request, or `null`.                 |
| `Slot`             | Renders what plugins put in a slot.                             |

They work on the server only. To use their data in a Client Component, read it in a Server
Component and pass it down as props.

## Settings

```tsx
const kernel = await getKernel()
const title = kernel.setting('site.title') ?? 'My Site'
const currency = kernel.setting('commerce.currency') // typed, once Commerce's types are loaded
```

Settings are typed by the `Settings` interface. Load a plugin's types to read its settings, with
`import type {} from '@otw/plugin-commerce'`.

## The signed-in user

```tsx filename="src/app/(site)/account-link.tsx"
import { getCurrentUser, getKernel } from '@otw/next/site'
import Link from 'next/link'

export async function AccountLink() {
  const [kernel, user] = await Promise.all([getKernel(), getCurrentUser()])
  if (!user) return <Link href="/admin/login">Sign in</Link>
  return (
    <span>
      Signed in as {user.name || user.email}
      {kernel.can(user, 'core.access_admin') && (
        <>
          {' · '}
          <Link href="/admin">Admin</Link>
        </>
      )}
    </span>
  )
}
```

`getCurrentUser()` looks the session up once per request, however many components ask.
`kernel.can(user, capability)` works as it does in plugins; `null` can do nothing.

## Plugin services and pages

A theme can use the same services plugins do, after checking the plugin is active:

```tsx filename="src/app/(site)/featured.tsx"
import { getKernel } from '@otw/next/site'
import type {} from '@otw/plugin-commerce'

export async function FeaturedProduct({ slug }: { slug: string }) {
  const kernel = await getKernel()
  if (!kernel.isActive('commerce')) return null
  const commerce = kernel.service('commerce')
  const product = await commerce.getProductBySlug(slug)
  if (!product) return null
  return (
    <a href={kernel.url('commerce.product', { slug })}>
      {product.title}, {commerce.formatMoney(product.price)}
    </a>
  )
}
```

`kernel.url(name, params)` builds the address of any plugin page from its qualified name, so links
keep working if the plugin's paths change. Commerce's pages are `commerce.shop`,
`commerce.product` (with a `slug`) and `commerce.order-received` (with an `id`). The services are
in the [Code Reference](/reference/services).

## Slots

`<Slot name="…" />` renders what plugins put in a slot, in their priority order. The CMS's site
slot is `header.nav`, for the main navigation; plugins may offer others. A slot with props takes
them as `props`:

```tsx
<Slot name="header.nav" />
```

The slots a site can render are listed under [Slots](/reference/slots); the ones starting with
`admin.` belong to the admin.

## The brand

`kernel.brand` is the CMS's name, link and logo, from `cms.config.json`, for a site that credits
the CMS, such as "Powered by …" in its footer. See [White label](/documentation/white-label).
