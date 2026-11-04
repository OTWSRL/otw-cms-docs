---
title: Pages and API routes
description: Add pages to the site with their own URLs, data and titles, and API endpoints for forms, scripts and webhooks.
order: 5
---

## Pages

`cms.routes.page()` adds a page to the site. The site's catch-all route serves it, inside the
site's own layout, so it looks like the rest of the site.

```tsx filename="src/index.tsx"
import { definePlugin } from '@otwdesign/sdk'

interface Recipe {
  slug: string
  title: string
  summary: string
}

const recipes: Recipe[] = [
  { slug: 'shakshuka', title: 'Shakshuka', summary: 'Eggs poached in a spiced tomato sauce.' },
]

export default definePlugin({
  id: 'recipes',
  version: '1.0.0',
  requires: { core: '^1.0.0' },
  setup(cms) {
    cms.routes.page({
      name: 'index',
      path: '/recipes',
      metadata: () => ({ title: 'Recipes' }),
      component: () => (
        <ul>
          {recipes.map((recipe) => (
            <li key={recipe.slug}>
              <a href={cms.routes.url('recipes.recipe', { slug: recipe.slug })}>{recipe.title}</a>
            </li>
          ))}
        </ul>
      ),
    })

    cms.routes.page({
      name: 'recipe',
      path: '/recipes/:slug',
      // Write load first: TypeScript takes `data`'s type from it.
      load: ({ params }) => recipes.find((recipe) => recipe.slug === params.slug) ?? null,
      metadata: ({ data }) => ({ title: data.title, description: data.summary }),
      component: ({ data }) => (
        <article>
          <h1>{data.title}</h1>
          <p>{data.summary}</p>
        </article>
      ),
    })
  },
})
```

| Field       | What it is                                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `name`      | Unique in the plugin. Others reach the page as `{pluginId}.{name}`, such as `recipes.recipe`.                        |
| `path`      | Where it's served. `:name` segments are parameters; `/` claims the home page.                                        |
| `load`      | Fetches the page's data from `params` and `searchParams`, and `user()`. Return `null` and the visitor gets a 404.    |
| `metadata`  | The page's `<title>` and meta description.                                                                           |
| `component` | Renders the page, with `data`, `params`, `searchParams` and `user()`. It's a Server Component, so it may be `async`. |

### Paths

- Paths start with `/`. A segment starting with `:` matches any one segment and is passed in
  `params`. Static segments beat parameters, so `/recipes/new` wins over `/recipes/:slug`.
- `/admin`, `/api`, `/uploads` and `/_next` belong to the CMS and Next.js; a page can't use them.
- Two pages that would answer the same URLs clash, and the second plugin fails to set up with the
  reason. Start paths with something your plugin owns.
- A page at `/` is the site's home page, unless the site has
  [a home page of its own](/themes/pages#the-home-page).
- A site can move your pages to other paths, keeping their parameters, with `routes` in its
  `cms.config.json`. See [Moving plugin pages](/themes/pages#moving-plugin-pages).

### Who's asking

A page's `load` knows who's asking, as an API route's handler does:

- **`context.user()`** is the signed-in user, or `null`. It's looked up the first time you ask,
  once per request, so a page that never asks pays nothing. `metadata` and `component` get it
  too.
- **`context.requireUser()`** is the signed-in user; a signed-out visitor is sent to sign in, and
  brought back to the page, query string and all, once they have, like WordPress's
  `auth_redirect()`.
- **Throw `ForbiddenError`** for someone who may not see the page: they get a 403.
- **Throw `PageRedirect`** to send the visitor elsewhere on the site, an old address to its new
  one, say, like `wp_safe_redirect()`. Paths on the site only.

```tsx filename="src/saved.tsx"
import { ForbiddenError, type PluginContext } from '@otwdesign/sdk'

export function registerSavedRecipes(cms: PluginContext) {
  cms.routes.page({
    name: 'saved',
    path: '/recipes/saved',
    load: async ({ requireUser }) => {
      const user = await requireUser()
      if (!cms.auth.can(user, 'core.read')) throw new ForbiddenError()
      return { name: user.name || user.email }
    },
    metadata: () => ({ title: 'Your saved recipes' }),
    component: ({ data }) => <h1>Saved by {data.name}</h1>,
  })
}
```

For a link rather than a redirect, such as "Sign in to save" on a page anyone can read,
`cms.routes.signInUrl(returnTo)` is the sign-in page that comes back to `returnTo`, like
`wp_login_url()`.

Pages that depend on who's asking are never cached for everyone: the site's pages render on each
request.

### Links between pages

Build URLs with `cms.routes.url(name, params)` rather than writing paths by hand:
`cms.routes.url('commerce.product', { slug: 'mug' })` is `/product/mug`, or the site's own path
for the page if it moved it. Any plugin's pages can be reached this way.

## API routes

`cms.routes.api()` adds an endpoint under `/api/p/{pluginId}`. The handler receives a standard
`Request` and returns a `Response`.

```ts filename="src/api.ts"
import type { PluginContext } from '@otwdesign/sdk'
import { HttpError } from '@otwdesign/sdk'

export function registerApi(cms: PluginContext) {
  // GET /api/p/recipes/search?q=egg
  cms.routes.api({
    method: 'GET',
    path: '/search',
    handler: (request) => {
      const query = new URL(request.url).searchParams.get('q')?.trim() ?? ''
      if (query.length < 2) throw new HttpError(400, 'Search for at least 2 characters')
      return Response.json({ query, results: [] })
    },
  })

  // POST /api/p/recipes/ratings/shakshuka
  cms.routes.api({
    method: 'POST',
    path: '/ratings/:slug',
    handler: async (request, { params }) => {
      const body = (await request.json().catch(() => null)) as { stars?: unknown } | null
      const stars = Number(body?.stars)
      if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
        throw new HttpError(422, 'Rate from 1 to 5 stars', { field: 'stars' })
      }
      cms.logger.info('Rated', { recipe: params.slug, stars })
      return new Response(null, { status: 204 })
    },
  })
}
```

`cms.routes.apiUrl('/search')` gives the full path, for forms and `fetch()`.

### Errors

- `throw new HttpError(status, message, details?)` answers with that status and
  `{ "error": message, "details": … }`.
- `throw new ForbiddenError()` answers 403.
- Anything else is logged, and the caller gets a 500 with no details.

### Who can call it

API routes are public: the CMS routes and guards requests before your handler runs, but anyone
can call them, so the handler decides who may do what.

- **Cross-site posts are refused.** A `POST`, `PUT`, `PATCH` or `DELETE` that carries another
  site's `Origin` header gets a 403, so other sites can't submit forms to yours.
- **Requests from other servers are let through.** Server-to-server calls, such as a payment
  provider's webhook, send no `Origin`. Your handler must check who's calling, usually with a
  signature: see [Security](/plugins/security#webhooks).
- **`context.user()` is the signed-in user**, from the request's session cookie, or `null`. It's
  looked up the first time you ask, so handlers that don't need it pay nothing.

```ts filename="src/favourites.ts"
import { HttpError, type PluginContext } from '@otwdesign/sdk'

declare module '@otwdesign/sdk' {
  interface Capabilities {
    /** Keep a list of favourite recipes. */
    'recipes.save_favourites': true
  }
}

export function registerFavourites(cms: PluginContext) {
  // POST /api/p/recipes/favourites/shakshuka, sent with fetch() from the site's own pages.
  cms.routes.api({
    method: 'POST',
    path: '/favourites/:slug',
    handler: async (_request, context) => {
      const user = await context.user()
      if (!user) throw new HttpError(401, 'Sign in to save favourites')
      if (!cms.auth.can(user, 'recipes.save_favourites')) throw new HttpError(403, 'Not allowed')
      cms.logger.info('Favourite saved', { recipe: context.params.slug, user: user.id })
      return new Response(null, { status: 204 })
    },
  })
}
```

Two rules keep a signed-in user's session from being used against them:

- **Unsafe requests count as signed in only with this site's `Origin`.** Browsers add it to
  `fetch()` calls and form posts from your own pages. A `POST` without one, such as a script
  replaying someone's cookie, is anonymous: `user()` returns `null`.
- **`GET` handlers must not change anything.** A link on another site can make a signed-in
  visitor's browser open a `GET` URL, with their session.

For forms on admin screens, use [admin actions](/plugins/admin/actions) instead: they check the
session and the capability for you, and answer with a redirect and a message.

Validate every value a request carries, as above: the query string, the body and the parameters.
