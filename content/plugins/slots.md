---
title: Slots
description: Render components on the Dashboard, in admin notices, in the site's navigation, or on another plugin's screens.
order: 4
---

A slot is a named place on a page where plugins render components, like WordPress's
`admin_notices` or a WooCommerce meta box. The page decides where the slot sits; plugins decide
what goes in it.

## Slots the CMS offers

| Slot                                                  | Where it is                                                 | Props                           |
| ----------------------------------------------------- | ----------------------------------------------------------- | ------------------------------- |
| [`admin.dashboard`](/reference/slots/admin.dashboard) | Widgets on the Dashboard                                    | `{ user }`                      |
| [`admin.notices`](/reference/slots/admin.notices)     | The top of every admin screen                               | `{ user }`                      |
| [`header.nav`](/reference/slots/header.nav)           | The site's main navigation, where the site's layout puts it | none                            |
| [`admin.footer`](/reference/slots/admin.footer)       | After every admin screen, for scripts and toolbars          | `{ user }`                      |
| [`site.footer`](/reference/slots/site.footer)         | The end of every page of the site, like `wp_footer`         | `{ user }`, which may be `null` |

Plugins offer their own, such as Commerce's `commerce.admin.order` beside an order's details. All
of them are listed under [Slots](/reference/slots) in the Code Reference.

## Filling a slot

`cms.slots.fill(name, { component, priority? })`: the site's slots in `setup()`, the admin's
(`admin.*`, and plugins' `{plugin}.admin.*`) in the plugin's
[admin entry](/plugins/admin#the-admin-entry), which only the admin loads. The component
receives the slot's props, and can be `async`: it's a React Server Component, so it can query the
database or call a service as it renders. Return `null` to show nothing.

```tsx filename="src/index.tsx"
import { definePlugin } from '@otw/sdk'
import type {} from '@otw/plugin-commerce'

export default definePlugin({
  id: 'shop-extras',
  version: '1.0.0',
  requires: { core: '^0.1.0', commerce: '^0.1.0' },
  setup(cms) {
    // A link in the site's navigation, after the shop's (priority 10).
    cms.slots.fill('header.nav', { component: () => <a href="/faq">FAQ</a>, priority: 20 })
  },
})
```

```tsx filename="src/admin.tsx"
import { Notice, Postbox } from '@otw/admin-ui'
import { defineAdmin } from '@otw/sdk'
import shopExtras from './index'

export default defineAdmin(shopExtras, (cms) => {
  // A notice for the people who handle orders, on every admin screen.
  cms.slots.fill('admin.notices', {
    component: ({ user }) =>
      cms.auth.can(user, 'commerce.manage_orders') ? (
        <Notice type="info">Orders placed after 2 pm ship the next working day.</Notice>
      ) : null,
  })

  // A box on Commerce's order screen.
  cms.slots.fill('commerce.admin.order', {
    component: async ({ order }) => (
      <Postbox id="shop-extras-packing" title="Packing">
        <p>
          {order.lines.reduce((sum, line) => sum + line.quantity, 0)} items to pack for order #
          {order.number}.
        </p>
      </Postbox>
    ),
  })
})
```

Fills render in order of `priority`, lowest first, then in the order plugins load.

> [!IMPORTANT]
> A slot shows its fills to whoever sees the page. Check capabilities in the component, from the
> `user` prop, before showing anything only some people should see, as the notice above does.

## Offering a slot

Declare it on `Slots` with its props, then render its fills where it belongs, with
`cms.slots.get(name)`:

```tsx
{
  cms.slots.get('events.event.after').map((Fill, index) => <Fill key={index} event={event} />)
}
```

Name a slot on your admin screens `{plugin}.admin.{name}`, like `commerce.admin.order`: that's
how the CMS knows other plugins fill it from their admin entry.

Call `get()` while rendering, not in `setup()`: plugins that load after yours haven't filled it
yet during your setup. A site's own layout renders slots with the `<Slot>` component; see
[Using the CMS in your pages](/themes/cms-data#slots). The full example is in
[Your own extension points](/plugins/hooks/extension-points).
