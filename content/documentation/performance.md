---
title: Performance
description: See how long every page took on the server and in the browser, with its queries, hooks and Web Vitals, in a bar at the bottom of the page.
order: 8
---

The **Performance** plugin shows administrators what each request cost, in a bar at the bottom of
every page of the site and every admin screen: how long the server took, what it queried and which
plugin did what, and how fast the browser got the page on screen. It's WordPress's Query Monitor,
with the browser's side too.

## Installing it

```bash
npm install @otw/plugin-performance
```

Add `"@otw/plugin-performance"` to `cms.config.json`, rebuild, and activate **Performance** on the
Plugins screen. A new site can start with it: `npm create otw-cms@latest my-site -- --plugins performance`.

Two files make it work, and both come with every new site:

- `src/instrumentation.ts`, which `cms generate` writes, records what the server does.
- The site's layout renders `<Slot name="site.footer" props={{ user }} />`, where the bar goes on
  the site. A site made before the bar existed adds that line to `src/app/(site)/layout.tsx`; see
  [Layout and styles](/themes/layout-and-styles).

## The bar

The bar shows the most telling numbers, each coloured green, yellow or red against
Google's Web Vitals thresholds. Click any of them for the details.

| Number      | What it is                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------- |
| **Server**  | From the request reaching the server to the end of its response.                            |
| **TTFB**    | Time to first byte: how long the browser waited for the first byte of the page.             |
| **FCP**     | First Contentful Paint: when the browser first drew some content.                           |
| **LCP**     | Largest Contentful Paint: when the biggest element appeared. Good is under 2.5 seconds.     |
| **CLS**     | Cumulative Layout Shift: how much the page moved as it loaded. Good is under 0.1.           |
| **INP**     | Interaction to Next Paint, once you've clicked or typed: how long the page took to respond. |
| **Queries** | Database queries, and their total time. Yellow when the same query ran more than once.      |
| **Hooks**   | How many action and filter handlers ran.                                                    |
| **Memory**  | The server's memory when the response ended.                                                |

## The details

Opening the bar shows these tabs. Press **Escape** to close it.

- **Server**: the totals, whether the CMS started during this request (the first one after a
  restart or a change in the admin pays for it), errors, and the main steps.
- **Timeline**: every step of the request, nested and to scale: Next.js's routing and rendering,
  each plugin's page load, every hook handler and query.
- **Database**: every query with its statement, rows, time and the plugin that ran it, the slowest
  marked. **Repeated queries** lists statements that ran more than once, usually a query inside a
  loop, which a plugin's developer should fix.
- **Hooks**: every action and filter that ran handlers, which plugins' handlers, and the time.
- **Plugins**: how long each plugin's own code took: its queries, hook handlers, page loads and
  setup.
- **Browser**: Web Vitals, and the page load step by step: connecting, waiting for the server,
  downloading, and building the page.
- **Resources**: the files the page loaded, by type and size, the slowest first, and which came
  from the browser's cache.
- **Navigations**: pages opened with the site's links, which load without reloading the page.

## Recent requests

**Performance › Recent requests** lists the last 100 requests made by people who can see the
bar, for ten minutes: method, path, status, server time, queries and memory. Each opens a page
with its full trace, to share with a developer or compare before and after a change.

## Who sees it

People with the **See request performance** capability (`performance.view`): administrators, and
any role a developer grants it to. Everyone else never sees the bar, and their requests are not
kept.

## Good to know

- **Query values are never recorded**: the bar shows `WHERE email = $1`, not the email.
- **Visitors' requests cost a little.** While the plugin is active, every request is recorded and
  dropped when it ends unless someone who can see the bar made it. Measured on a shop page:
  0.15 milliseconds per request, against 4.2 milliseconds for the page.
- **On the site, the server tabs show the page you loaded.** Pages opened with the site's links
  show in Navigations with the browser's timings; reload one to see its server trace. In the
  admin, the server tabs follow every screen you open.
- **On several servers,** the bar may ask a different server for the trace than the one that made
  it, and find nothing. Reload, or look in Recent requests on each server.
