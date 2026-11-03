---
title: Tracing
description: What the CMS records about each request, how to read it with cms.traces, add spans of your own with OpenTelemetry, and test them.
order: 9.5
---

The CMS can record every request as an [OpenTelemetry](https://opentelemetry.io) trace: a tree of
timed **spans**, each a step of the request. The Performance plugin shows them; your plugin can
read them, and add spans of its own.

## What's recorded

Without any code of yours, a request's trace holds:

| Span                                                                                  | Kind                         | Plugin                           |
| ------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------- |
| The request, Next.js's routing, rendering and metadata                                | `request`, `render`          | –                                |
| `kernel boot`, then `setup {id}` and `migrate {id}/{migration}` for each plugin       | `boot`, `setup`, `migration` | the plugin                       |
| `action {name}` and `filter {name}`, for each handler                                 | `hook`                       | the handler's plugin             |
| `load {plugin}.{page}` and `metadata …`, for a page route                             | `page`                       | the page's plugin                |
| `load {plugin}.{page}`, for an admin page                                             | `admin`                      | the page's plugin                |
| `{METHOD} {path}`, for an API route or admin action                                   | `api`                        | the route's plugin               |
| `db.query`, for every query, with `db.statement`, `db.params` (a count) and `db.rows` | `query`                      | the plugin of the span it ran in |

A query's plugin is that of the nearest span around it that has one, so a query in your hook
handler counts as yours. Parameter values are never recorded.

## Reading traces

`cms.traces` reads the traces of the requests your plugin keeps:

| Member        | What it does                                                                                |
| ------------- | ------------------------------------------------------------------------------------------- |
| `enable()`    | Records requests while your plugin is active. Call it in `setup()`.                         |
| `available`   | Whether requests are being recorded: enabled, and the site loads the CMS's instrumentation. |
| `currentId()` | The current request's trace id, while it's recorded.                                        |
| `keep(id)`    | Keeps that request's trace once it ends. Others are dropped when their request ends.        |
| `get(id)`     | A kept trace, as a `RequestTrace`, finished or still running.                               |
| `list()`      | The kept traces, newest first: at most 100, for 10 minutes.                                 |

Nothing is recorded until an active plugin calls `enable()`. Then every request is recorded, and
kept only if a plugin keeps it. Keep only what someone will look at.

```tsx filename="src/index.tsx"
import { definePlugin } from '@otwdesign/sdk'

export default definePlugin({
  id: 'slow-pages',
  version: '1.0.0',
  requires: { core: '^1.0.0' },
  setup(cms) {
    cms.traces.enable()
  },
})
```

```tsx filename="src/admin.tsx"
import { defineAdmin } from '@otwdesign/sdk'
import slowPages from './index'

export default defineAdmin(slowPages, (cms) => {
  // Keep the admin's own requests, for a list of slow admin screens elsewhere in the plugin.
  cms.slots.fill('admin.footer', {
    component: ({ user }) => {
      const id = cms.traces.currentId()
      if (id && cms.auth.can(user, 'core.manage_plugins')) cms.traces.keep(id)
      return null
    },
  })
})
```

## Adding spans of your own

Wrap work worth timing in a span with the OpenTelemetry API. It joins the current request's trace
by itself. Set `otw.plugin` to your plugin's id so the work is attributed to you, and `otw.kind`
to one of the kinds above, or leave it out.

```ts filename="src/search.ts"
import { trace } from '@opentelemetry/api'
import type { PluginContext } from '@otwdesign/sdk'

export function registerSearch(cms: PluginContext) {
  cms.routes.page({
    name: 'results',
    path: '/search',
    load: ({ searchParams }) =>
      trace.getTracer('acme-search').startActiveSpan(
        'search index',
        {
          attributes: {
            'otw.plugin': 'search',
            'search.query.length': String(searchParams.q ?? '').length,
          },
        },
        async (span) => {
          try {
            return { results: [] as string[] }
          } finally {
            span.end()
          }
        },
      ),
    component: () => null,
  })
}
```

Ask for the tracer when you start a span, as above, rather than once when your module loads: a
tracer taken before the site's instrumentation has started may never record. Add
`@opentelemetry/api` as a peer dependency. It does nothing when the site isn't recording, so the
span costs nothing then. Don't put personal data or secrets in attributes: traces are shown to
administrators.

## Testing

`createTestKernel({ tracing: true })` records requests: `request()` runs inside a request span,
and `inRequest(path, fn)` runs any code as one and returns its trace id.

```ts filename="test/search.test.ts"
import { trace } from '@opentelemetry/api'
import { definePlugin } from '@otwdesign/sdk'
import { createTestKernel } from '@otwdesign/testing'
import { expect, it } from 'vitest'
import { registerSearch } from '../src/search'

const search = definePlugin({ id: 'search', version: '1.0.0', setup: registerSearch })

it('times the search index, as the search plugin’s work', async () => {
  const site = await createTestKernel({ plugins: [search], tracing: true })
  const id = await site.inRequest('/search', async () => {
    site.traces!.keep(trace.getActiveSpan()!.spanContext().traceId)
    await site.kernel.resolvePage('/search', { q: 'mug' })
  })
  const span = site.traces!.get(id!)!.spans.find((entry) => entry.name === 'search index')
  expect(span?.plugin).toBe('search')
  await site.close()
})
```

See [Hosting › Tracing](/hosting/tracing) for how a site turns recording on, and how it works with
a site's own OpenTelemetry setup.
