---
title: Testing
description: Test a plugin against a real database with @otwdesign/testing. Boot it, render its pages, post to its actions as a signed-in user, and reboot after changes.
order: 9
---

`@otwdesign/testing` boots the CMS with your plugin on a fresh, in-memory PostgreSQL (PGlite), with
every migration applied. Tests run against the real kernel and the real database, so they catch
what mocks would miss: a query that doesn't match the migrated table, a hook that never fires, a
capability nobody granted.

Add it, and a test runner such as [Vitest](https://vitest.dev), as development dependencies.

## A first test

```tsx filename="src/index.tsx"
import { definePlugin } from '@otwdesign/sdk'

declare module '@otwdesign/sdk' {
  interface Settings {
    /** What the greeting page says. */
    'greeting.message': string
  }
}

export default definePlugin({
  id: 'greeting',
  version: '1.0.0',
  requires: { core: '^1.0.0' },
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
  },
})
```

```tsx filename="src/admin.tsx"
import { defineAdmin } from '@otwdesign/sdk'
import greeting from './index'

export default defineAdmin(greeting, (cms) => {
  cms.slots.fill('admin.dashboard', {
    component: () => <p>{cms.settings.get('greeting.message')}</p>,
  })
})
```

```ts filename="test/greeting.test.ts"
import { createTestKernel, type TestKernel } from '@otwdesign/testing'
import { afterEach, describe, expect, it } from 'vitest'
import greetingAdmin from '../src/admin'
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

  it('says what the setting says, on the Dashboard too', async () => {
    site = await createTestKernel({
      plugins: [greeting],
      admin: [greetingAdmin],
      settings: { 'greeting.message': 'Hi' },
    })
    expect(site.kernel.setting('greeting.message')).toBe('Hi')
    expect(site.kernel.slot('admin.dashboard')).toHaveLength(1)
  })
})
```

`createTestKernel()` takes the plugins to load (with the plugins they need), and optionally their
admin entries (`admin`), as the admin and the API routes load them, fixed `settings`, the
`active` plugins, and anything else the kernel accepts. Leave `admin` out to test the plugin as
the site's pages see it. It's **strict**: a plugin
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

The package also exports `TEST_PASSWORD`, the password `signIn()` gives the users it creates, for
a test that signs in through the form; `TEST_ORIGIN`, the site's address in tests; and
`createMemoryLogger()`, the logger the test kernel keeps, for code you test without a kernel.

## Testing admin actions

`request()` sends unsafe requests with this site's `Origin`, as a browser would; `json` and `form`
encode the body. Pass the `cookie` from `signIn()` to act as that user.

```ts filename="src/notes.ts"
import { definePlugin } from '@otwdesign/sdk'
import { sql } from 'drizzle-orm'

declare module '@otwdesign/sdk' {
  interface Capabilities {
    /** Leave notes for the team. */
    'notes.write': true
  }
}

export default definePlugin({
  id: 'notes',
  version: '1.0.0',
  requires: { core: '^1.0.0' },
  migrations: [
    {
      id: '0001_notes',
      up: (db) => db.execute(sql`CREATE TABLE notes_notes (body text NOT NULL)`),
    },
  ],
  setup(cms) {
    cms.auth.capability('notes.write', { label: 'Write notes' })
  },
})
```

```ts filename="src/notes-admin.ts"
import { ActionError, defineAdmin } from '@otwdesign/sdk'
import { sql } from 'drizzle-orm'
import notes from './notes'

export default defineAdmin(notes, (cms) => {
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
})
```

```ts filename="test/notes.test.ts"
import { createTestKernel, TEST_ORIGIN, type TestKernel } from '@otwdesign/testing'
import { sql } from 'drizzle-orm'
import { afterEach, expect, it } from 'vitest'
import notes from '../src/notes'
import notesAdmin from '../src/notes-admin'

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
  site = await createTestKernel({ plugins: [notes], admin: [notesAdmin] })
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
  site = await createTestKernel({ plugins: [notes], admin: [notesAdmin] })
  const { cookie } = await site.signIn()
  const response = await site.request('POST', ADD, { cookie, form: { body: ' ' } })
  expect(outcome(site, response).flash).toEqual({
    kind: 'error',
    message: 'Write something first.',
  })
})

it('refuses people without the capability, and posts from other sites', async () => {
  site = await createTestKernel({ plugins: [notes], admin: [notesAdmin] })
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
import commerce from '@otwdesign/plugin-commerce'

const site = await createTestKernel({ plugins: [commerce, myPlugin] })
const shop = site.kernel.service('commerce')
```

For an optional integration, test once with the other plugin and once without.

## After a change in the admin

Activation and settings changes take effect when the site starts again. In a test, make the change
(post to the core action, or write the setting), then `await site.reboot()` and check the new
kernel.

## A development site

Unit tests boot the kernel; some things only show in a browser: a page's layout, a form that
posts, a client component, what reaches visitors' JavaScript. For those, keep an OTW site inside
the plugin's repository, in `site/`, and test it with [Playwright](https://playwright.dev). The
CMS's own plugins work this way.

```
plugin-greeting/
  package.json            the plugin, published to npm
  src/
  pnpm-workspace.yaml     lists . and site
  site/
    package.json          a site that installs the plugin
    cms.config.json
    next.config.ts
    fixture/              a test plugin that uses the plugin's extension points
    e2e/
```

Make the site with `create-otw-cms`, then install the plugin from the workspace:
`"@acme/plugin-greeting": "workspace:*"` in `site/package.json`. Use a pnpm workspace, so the
plugin and the site share one copy of each CMS package, as a site and its plugins must (see
[The package](/plugins/publishing#the-package)). List the plugin in `site/cms.config.json`: on a
site's first start, every plugin listed is active.

The plugin sits outside `site/`, so widen Next.js's root to the repository:

```ts filename="site/next.config.ts"
import { resolve } from 'node:path'
import { withCms } from '@otwdesign/next/config'

// The plugin is the repository's root, one level up, so Turbopack's root must hold both.
const root = resolve(process.cwd(), '..')

export default withCms({ turbopack: { root }, outputFileTracingRoot: root })
```

### Fixture plugins

To test what other plugins do with yours, put a small plugin in the site that uses your hooks,
slots and services, as a real one would: `site/fixture`, with a `package.json` whose `exports`
points at its source, installed as `"greeting-fixture": "link:fixture"` and listed in
`site/cms.config.json`. Mark it `"private": true`, so it can't be published by mistake. The CMS
tests itself the same way, with fixture plugins in its own test site.

### End-to-end tests

Playwright builds the site, starts it on a fresh embedded database, and runs the tests in order:
the first one sets the site up, as a person would.

```ts filename="site/playwright.config.ts"
import { defineConfig, devices } from '@playwright/test'

const PORT = 3100

export default defineConfig({
  testDir: './e2e',
  // One server on one database, set up by the first test.
  workers: 1,
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // A fresh database each run, so the first visit sets the site up.
    command: `node -e "fs.rmSync('.data/e2e', { recursive: true, force: true })" && pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: { CMS_DATA_DIR: '.data/e2e', DATABASE_URL: '' },
  },
})
```

```ts filename="site/e2e/greeting.spec.ts"
import { expect, test } from '@playwright/test'

const ADMIN = { name: 'Ada Admin', email: 'ada@example.com', password: 'a strong e2e password' }

// One site, set up by the first test; the rest build on it.
test.describe.configure({ mode: 'serial' })

test('the first visit sets up the administrator', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL('/admin/setup')
  await page.getByLabel('Name').fill(ADMIN.name)
  await page.getByLabel('Email').fill(ADMIN.email)
  await page.getByLabel('Password').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Create administrator' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Your site is ready.' })).toBeVisible()
})

test('the greeting page says hello', async ({ page }) => {
  await page.goto('/hello')
  await expect(page.getByRole('heading', { name: 'Hello, world!' })).toBeVisible()
})
```

Give each repository's tests their own port, so two can run at once. In CI, install the browser
first (`playwright install --with-deps chromium`) and keep the traces of a failed run.
