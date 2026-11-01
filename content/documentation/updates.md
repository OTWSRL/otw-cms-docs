---
title: Updating
description: Keep the CMS and its plugins up to date from Dashboard › Updates, turn on automatic updates, and roll back.
order: 6
---

New versions of the CMS and its plugins fix problems and add features. **Dashboard › Updates**
shows what's waiting and, where the hosting allows, installs it. It needs **Update the CMS and
plugins** (`core.manage_updates`), which only administrators have.

What the screen offers depends on how the site is hosted.

## Sites run with `cms serve`

On your own server, with the site started by `cms serve`, updates work as in WordPress:

- The screen lists the new versions of the CMS and of each plugin, and whether each plugin
  supports the new version of the CMS. **Check again** looks now; the site also checks twice a
  day.
- **Update to version …** updates the CMS, and **Update Plugins** the plugins you tick. The site
  keeps serving while the update builds beside it, and a progress box follows it; then it
  backs up the database, applies the update's database changes, starts the new version, checks it
  answers, and switches visitors over. With the embedded database, visitors see "being updated"
  for a few seconds during the switch.
- If anything fails, the old version keeps serving and the database backup is restored, so a
  failed update changes nothing.
- The Plugins screen offers **Update now** for each plugin with a new version.

### Automatic updates

Under **Automatic updates**, choose **Patch releases of OTW CMS and plugins** to have bug-fix
releases (such as 1.4.2 → 1.4.3) installed twice a day as they come out. Bigger releases always
wait for you.

### Rolling back

**Releases** lists the versions the site has run. **Roll back to this release** runs an earlier
one again. The database stays as it is, since updates only add to it.

## Sites built from GitHub

Sites hosted on Vercel and similar services are built from their GitHub repository, so an update
is a change to the repository. With the site [set up for it](/hosting/updates#from-the-admin-on-github),
the screen offers **Check for updates and open a pull request**: GitHub runs the update and opens
a pull request with it. Merging the pull request deploys it, and the database is updated as part
of the deploy.

## Other sites

When the site can't update itself, the screen says which version it runs and gives the commands
for whoever deploys it. See [Updating a site](/hosting/updates).

## Before you update

- **Back up.** Updates back up the database themselves, but your own backups are the ones you
  can count on.
- **Check the plugins.** The screen says which plugins support the new version. A plugin another
  plugin still needs in an older version is held back, and says why.
- **Try it on a staging site** first, if you have one.
