---
title: Security
description: A checklist for running a site safely. Setup, HTTPS, secrets, backups, sign-in limits and updates.
order: 9
---

The CMS protects sessions, forms and passwords on its own (see the Plugin Handbook's
[Security](/plugins/security) for what it does). These are the parts that depend on how a site is
run.

## Before going live

- **Run setup first.** The first visit to `/admin` creates the administrator, as WordPress's
  installer does. Do it before you share the address.
- **Serve it over HTTPS.** The session cookie is marked `Secure`, with a `__Host-` name, when the
  site runs on HTTPS.
- **Tell it its address** behind a proxy, with `SITE_URL` or `CMS_TRUST_PROXY=1`. See
  [Behind a reverse proxy](/hosting/reverse-proxy).

## Secrets

- Keep keys and tokens in environment variables or a `.env` file that isn't committed. New sites'
  `.gitignore` already leaves `.env` out.
- Give `CMS_GITHUB_TOKEN` access to the one repository, and only to Actions.

## Sign-in

The CMS limits failed sign-ins to five per email address every fifteen minutes; changing an
account's password or email address counts against the same limit. Limiting by IP address belongs
in front of the site, in your proxy or firewall, where the visitor's real address is known.

[Accounts](/documentation/accounts) never say whether an address has one: sign-up, lost password
and their emails answer the same either way. Their links are random, kept only as hashes, work
once for a day, and an address gets three such emails an hour at most. Setting a password from one
ends every session; changing a password ends every other. Pages with a link's token in their
address tell the browser not to send it to other sites.

## Backups

Back up the database regularly, and test restoring it. `cms migrate` and `cms serve` back up before
updates, but those backups sit on the same server. See [Databases](/hosting/database#backups).

## Updates

Keep the CMS and plugins current: most releases fix something. With `cms serve`, turn on automatic
patch releases under **Dashboard › Updates**.

## Plugins

Plugins run with the site's full access, as in WordPress. Install them from people you trust, and
keep the list short.
