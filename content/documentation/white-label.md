---
title: White label
description: Sell or hand over sites under your own brand. Rename the CMS in the admin, link it to your site, and use your own logo.
order: 7
---

Agencies often hand clients a site under the agency's own brand. OTW CMS supports this: the
name, link and logo the admin shows for the CMS come from the site's configuration, not from the
code.

## What changes

With a brand set, the admin shows it instead of "OTW CMS":

- The footer of every admin screen: "Thank you for creating with _Your Brand_."
- **At a Glance** on the Dashboard, with the version.
- **Dashboard › Updates**.
- The sign-in and setup screens, which show your logo and say "Powered by _Your Brand_".
- The messages and commit titles of `cms update`, including the pull requests GitHub opens.

## Setting a brand

Add `brand` to the site's `cms.config.json`, then rebuild:

```json filename="cms.config.json"
{
  "plugins": ["@otwdesign/plugin-commerce"],
  "brand": {
    "name": "Acme Sites",
    "url": "https://acme.example",
    "logo": "/brand/logo.svg"
  }
}
```

| Field  | Required | What it is                                                                                                                   |
| ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `name` | Yes      | The name the admin uses for the CMS, up to 60 characters.                                                                    |
| `url`  | No       | Where the name and the sign-in logo link, such as your site. It must start with `http://` or `https://`.                     |
| `logo` | No       | An image for the sign-in screens, 84 pixels square: a path on the site (put the file in `public/`) or an `https://` address. |

The brand is part of the site's code, not a setting in the admin, so a client can't remove it.
The build stops with an explanation if a field isn't valid, such as a link that isn't `http` or
`https`.

## What stays the same

The names developers see don't change: the `@otwdesign/*` packages, the `cms` command, the `CMS_*`
environment variables and the database's tables. A white-labelled WordPress keeps its `wp_` tables
too. The site's own title is separate from the brand: it's set under
[Settings › General](/documentation/settings).
