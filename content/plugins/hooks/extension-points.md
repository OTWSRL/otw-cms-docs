---
title: Your own extension points
description: Declare actions, filters, registries, services and slots of your own, with types, so other plugins can extend yours.
order: 3
---

A plugin becomes a platform when others can extend it. Commerce is the example: it knows
nothing about Stripe, yet Stripe adds a payment method, a settings section and a panel on the
order screen, all through extension points Commerce declared.

## Declaring them

Extension points are declared on `@otwdesign/sdk`'s interfaces with TypeScript's declaration merging.
One interface per kind:

| Interface          | Declares                                     | Used with                                  |
| ------------------ | -------------------------------------------- | ------------------------------------------ |
| `Actions`          | An action and its payload                    | `cms.hooks.doAction()` / `addAction()`     |
| `Filters`          | A filter as `[value, context]`               | `cms.hooks.applyFilters()` / `addFilter()` |
| `Registries`       | A registry and the type of its items         | `cms.registries.define()` / `get()`        |
| `Services`         | A service and its API                        | `cms.services.provide()` / `get()`         |
| `Slots`            | A slot and the props its fills receive       | `cms.slots.get()` / `fill()`               |
| `Settings`         | A setting and its value's type               | the plugin's `settings`                    |
| `Capabilities`     | A capability (always `true`)                 | `cms.auth.capability()`                    |
| `MetaCapabilities` | A meta capability and the arguments it takes | `cms.auth.metaCapability()`                |

Put the declarations in a file the package's entry exports, so they load wherever the package's
types do. Give each one a doc comment: it becomes the description in the
[Code Reference](/reference) and in other developers' editors.

```ts filename="src/types.ts"
import type { RegistryItem } from '@otwdesign/sdk'

export interface Event {
  id: string
  title: string
  startsAt: Date
}

/** Somewhere that sells tickets for events. */
export interface TicketProvider extends RegistryItem {
  label: string
  url(event: Event): string
}

/** Events' API for the plugins that depend on it. */
export interface EventsService {
  upcoming(): Promise<Event[]>
}

declare module '@otwdesign/sdk' {
  interface Actions {
    /** An event was published and is now on the site. */
    'events.event.published': { event: Event }
  }
  interface Filters {
    /** The title an event's page and lists show. */
    'events.event.title': [string, { event: Event }]
  }
  interface Registries {
    /** Where tickets for an event can be bought; each shows as a link on the event's page. */
    'events.ticket_providers': TicketProvider
  }
  interface Services {
    /** Events' API. */
    events: EventsService
  }
  interface Slots {
    /** Below an event's details, on its page. */
    'events.event.after': { event: Event }
  }
}
```

## Using them

The owning plugin defines its registries, provides its service, and fires its hooks where they
belong:

```tsx filename="src/index.tsx"
import { definePlugin } from '@otwdesign/sdk'
import type { Event } from './types'

export * from './types'

const calendar: Event[] = [
  { id: 'launch', title: 'Launch party', startsAt: new Date('2027-03-01T19:00:00Z') },
]

export default definePlugin({
  id: 'events',
  version: '1.0.0',
  requires: { core: '^1.0.0' },
  setup(cms) {
    const providers = cms.registries.define('events.ticket_providers')

    cms.services.provide('events', {
      upcoming: async () => calendar.filter((event) => event.startsAt > new Date()),
    })

    cms.routes.page({
      name: 'event',
      path: '/events/:id',
      load: ({ params }) => calendar.find((event) => event.id === params.id) ?? null,
      metadata: async ({ data }) => ({
        title: await cms.hooks.applyFilters('events.event.title', data.title, { event: data }),
      }),
      component: ({ data }) => (
        <article>
          <h1>{data.title}</h1>
          <ul>
            {providers.list().map((provider) => (
              <li key={provider.id}>
                <a href={provider.url(data)}>{provider.label}</a>
              </li>
            ))}
          </ul>
          {cms.slots.get('events.event.after').map((Fill, index) => (
            <Fill key={index} event={data} />
          ))}
        </article>
      ),
    })
  },
})
```

Firing an action is one line wherever the event happens, such as in the admin action that
publishes an event: `await cms.hooks.doAction('events.event.published', { event })`.

## What other plugins write

A plugin that extends Events requires it, loads its types, and uses the extension points:

```ts filename="src/tickets.ts"
import { definePlugin } from '@otwdesign/sdk'
// From its own package this is: import type {} from '@acme/plugin-events'
import type {} from './types'

export default definePlugin({
  id: 'tickets',
  version: '1.0.0',
  requires: { core: '^1.0.0', events: '^1.0.0' },
  setup(cms) {
    cms.registries.get('events.ticket_providers').add({
      id: 'tickets',
      label: 'Buy tickets',
      url: (event) => `/tickets/${event.id}`,
    })
    cms.hooks.addAction('events.event.published', ({ event }) => {
      cms.logger.info('Tickets on sale', { event: event.id })
    })
  },
})
```

## Naming

- Start every name with your plugin's id: `events.event.published`, `events.ticket_providers`.
- Name actions for what happened, in the past tense: `order.paid`, `event.published`.
- Name filters for the value they carry: `cart.totals`, `event.title`.
- Treat names and payloads as public API: renaming one, or removing a field from a payload, is a
  breaking change for every plugin that uses it. Add fields instead, and bump your major version
  when you must break something.
