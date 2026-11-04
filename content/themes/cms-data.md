---
title: Using the CMS in your pages
description: Read settings, check who's signed in, call plugin services, link to plugin pages and render slots from the site's layouts and pages.
order: 3
---

Layouts and pages are React Server Components, so they read from the CMS directly. Everything
comes from `@otwdesign/next/site`.

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
`import type {} from '@otwdesign/plugin-commerce'`.

The CMS's own, which plugins read the same way:

| Setting              | What it is                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `site.title`         | The site's name, from Settings › General.                                                           |
| `site.url`           | The public address, for links that leave the site; empty means each request's own. `SITE_URL` wins. |
| `site.locale`        | Formats numbers and prices, such as `en-US`. `SITE_LOCALE` wins.                                    |
| `reading.*`          | Settings › Reading: what the home page shows, the posts page, and how many entries a page lists.    |
| `media.*`            | Settings › Media: the image sizes, and year and month folders.                                      |
| `mail.from`          | Who the site's email comes from. `MAIL_FROM` wins.                                                  |
| `users.can_register` | Whether anyone can sign up on the site.                                                             |

Each one's type and description are in the Code Reference under [Settings](/reference/settings).

## The signed-in user

```tsx filename="src/app/(site)/account-link.tsx"
import { getCurrentUser, getKernel } from '@otwdesign/next/site'
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
import { getKernel } from '@otwdesign/next/site'
import type {} from '@otwdesign/plugin-commerce'

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

`<Slot name="…" />` renders what plugins put in a slot, in their priority order. The site's layout
renders the CMS's two site slots; plugins may offer others. A slot with props takes them as
`props`:

- `header.nav`, the main navigation's links.
- `site.footer`, the end of every page, as WordPress's `wp_footer`. It gets the signed-in person,
  or `null`, so a plugin such as Performance can show something only to administrators.

```tsx
<Slot name="header.nav" />
<Slot name="site.footer" props={{ user }} />
```

A layout without `site.footer` hides what plugins put there. `account.sections` is a site slot too,
but the CMS's account page renders it, after its own sections, so a layout doesn't.

The slots a site can render are listed under [Slots](/reference/slots); the ones starting with
`admin.` belong to the admin.

## The brand

`kernel.brand` is the CMS's name, link and logo, from `brand` in `cms.config.json`, for a site that
credits the CMS, such as "Powered by …" in its footer: `name`, `url` (where the name links) and
`logo` (a path on the site or an https URL). Without a brand, the name is "OTW CMS" and the other
two are unset. See [White label](/documentation/white-label).
