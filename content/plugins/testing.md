---
title: Testing
description: Test a plugin against a real database with @otw/testing. Boot it, render its pages, post to its actions as a signed-in user, and reboot after changes.
order: 9
---

`@otw/testing` boots the CMS with your plugin on a fresh, in-memory PostgreSQL (PGlite), with
every migration applied. Tests run against the real kernel and the real database, so they catch
what mocks would miss: a query that doesn't match the migrated table, a hook that never fires, a
capability nobody granted.

Add it, and a test runner such as [Vitest](https://vitest.dev), as development dependencies.

## A first test

```tsx filename="src/index.tsx"
import { definePlugin } from '@otw/sdk'

declare module '@otw/sdk' {
  interface Settings {
    /** What the greeting page says. */
    'greeting.message': string
  }
}

export default definePlugin({
  id: 'greeting',
  version: '1.0.0',
  requires: { core: '^0.1.0' },
  settings: {
    'greeting.message': { type: 'text', label: 'Message', default: 'Hello, world!' },
  },
  setup(cms) {
    cms.routes.page({
      name: 'hello',
      path: '/hello',
      metadata: () => ({ title: 'Hello' }),
      component: () => <h1>{cms.settings.get('greeting.message')}</h1>,
    })
    cms.slots.fill('admin.dashboard', {
      component: () => <p>{cms.settings.get('greeting.message')}</p>,
    })
  },
})
```

```ts filename="test/greeting.test.ts"
import { createTestKernel, type TestKernel } from '@otw/testing'
import { afterEach, describe, expect, it } from 'vitest'
import greeting from '../src/index'

let site: TestKernel | undefined
afterEach(() => site?.close())

describe('greeting', () => {
  it('serves its page', async () => {
    site = await createTestKernel({ plugins: [greeting] })
    const page = await site.kernel.resolvePage('/hello')
    expect(await page!.metadata()).toEqual({ title: 'Hello' })
    expect(await site.kernel.resolvePage('/goodbye')).toBeNull()
  })

  it('says what the setting says', async () => {
    site = await createTestKernel({ plugins: [greeting], settings: { 'greeting.message': 'Hi' } })
    expect(site.kernel.setting('greeting.message')).toBe('Hi')
    expect(site.kernel.slot('admin.dashboard')).toHaveLength(1)
  })
})
```

`createTestKernel()` takes the plugins to load (with the plugins they need), and optionally fixed
`settings`, the `active` plugins, and anything else the kernel accepts. It's **strict**: a plugin
that fails to set up throws, rather than being left out as on a live site, so a broken plugin
fails its test.

## What the test kernel offers

| Member                         | What it does                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `kernel`                       | The booted kernel: `resolvePage()`, `setting()`, `slot()`, `service()`, `can()`, `handleApi()` and more. |
| `db`                           | The database, for setting up data and checking what was written.                                         |
| `logger`                       | Keeps log entries in `logger.entries`, to check warnings and errors.                                     |
| `signIn(role?)`                | Creates a user with that role (an administrator by default) and a session. Returns `{ user, cookie }`.   |
| `request(method, path, init?)` | Sends a request to an API route or admin action, as a browser from this site would.                      |
| `reboot()`                     | Starts a fresh kernel on the same database, as the site does after an admin changes something.           |
| `close()`                      | Closes the database. Call it after each test.                                                            |

## Testing admin actions

`request()` sends unsafe requests with this site's `Origin`, as a browser would; `json` and `form`
encode the body. Pass the `cookie` from `signIn()` to act as that user.

```ts filename="src/notes.ts"
import { ActionError, definePlugin } from '@otw/sdk'
import { sql } from 'drizzle-orm'

declare module '@otw/sdk' {
  interface Capabilities {
    /** Leave notes for the team. */
    'notes.write': true
  }
}

export default definePlugin({
  id: 'notes',
  version: '1.0.0',
  requires: { core: '^0.1.0' },
  migrations: [
    {
      id: '0001_notes',
      up: (db) => db.execute(sql`CREATE TABLE notes_notes (body text NOT NULL)`),
    },
  ],
  setup(cms) {
    cms.auth.capability('notes.write', { label: 'Write notes' })
    cms.admin.action({
      name: 'add',
      capability: 'notes.write',
      async handler({ form }) {
        const body = String(form.get('body') ?? '').trim()
        if (!body) throw new ActionError('Write something first.')
        await cms.db.execute(sql`INSERT INTO notes_notes (body) VALUES (${body})`)
        return { notice: 'Note added.' }
      },
    })
  },
})
```

```ts filename="test/notes.test.ts"
import { createTestKernel, TEST_ORIGIN, type TestKernel } from '@otw/testing'
import { sql } from 'drizzle-orm'
import { afterEach, expect, it } from 'vitest'
import notes from '../src/notes'

const ADD = '/api/p/notes/actions/add'
let site: TestKernel | undefined
afterEach(() => site?.close())

/** Where an action sent the browser, and the one-time message it carried. */
function outcome(site: TestKernel, response: Response) {
  const location = new URL(response.headers.get('location') ?? '', TEST_ORIGIN)
  const flash = location.searchParams.get('flash') ?? undefined
  return { path: location.pathname, flash: site.kernel.readFlash(flash) }
}

it('adds a note for someone who may write them', async () => {
  site = await createTestKernel({ plugins: [notes] })
  const { cookie } = await site.signIn()
  const response = await site.request('POST', ADD, {
    cookie,
    form: { body: 'Restock the mugs' },
    headers: { referer: `${TEST_ORIGIN}/admin/notes` },
  })
  expect(response.status).toBe(303)
  expect(outcome(site, response)).toEqual({
    path: '/admin/notes',
    flash: { kind: 'notice', message: 'Note added.' },
  })
  const result = (await site.db.execute(sql`SELECT body FROM notes_notes`)) as unknown as {
    rows: { body: string }[]
  }
  expect(result.rows).toEqual([{ body: 'Restock the mugs' }])
})

it('explains a mistake on the form', async () => {
  site = await createTestKernel({ plugins: [notes] })
  const { cookie } = await site.signIn()
  const response = await site.request('POST', ADD, { cookie, form: { body: ' ' } })
  expect(outcome(site, response).flash).toEqual({
    kind: 'error',
    message: 'Write something first.',
  })
})

it('refuses people without the capability, and posts from other sites', async () => {
  site = await createTestKernel({ plugins: [notes] })
  const customer = await site.signIn('customer')
  expect(
    (await site.request('POST', ADD, { cookie: customer.cookie, form: { body: 'x' } })).status,
  ).toBe(403)

  const admin = await site.signIn()
  const forged = await site.request('POST', ADD, {
    cookie: admin.cookie,
    form: { body: 'x' },
    headers: { origin: 'https://elsewhere.example' },
  })
  expect(forged.status).toBe(403)
})
```

## Testing with other plugins

Load the plugins yours works with, the way a site would, and check the integration from both
sides: that your handler runs when theirs fires, and that your registry items show up in their
lists.

```ts
import commerce from '@otw/plugin-commerce'

const site = await createTestKernel({ plugins: [commerce, myPlugin] })
const shop = site.kernel.service('commerce')
```

For an optional integration, test once with the other plugin and once without.

## After a change in the admin

Activation and settings changes take effect when the site starts again. In a test, make the change
(post to the core action, or write the setting), then `await site.reboot()` and check the new
kernel.
