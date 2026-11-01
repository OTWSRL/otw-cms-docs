---
title: Your own server
description: Run a site on a VPS or dedicated server with cms serve, which builds releases, switches between them, and updates the site from the admin.
order: 2
---

On a server you control, `cms serve` runs the site and does what WordPress does for itself:
check for updates, install them from the admin, and roll back. Use it instead of `next build`
and `next start`.

## Starting it

In the site's directory, after installing its dependencies:

```bash
npx cms serve
```

It builds the site into a **release** in `.cms/releases`, starts it, and serves it on port
3000, or `PORT`.

| Option           | Default         | What it is                                                      |
| ---------------- | --------------- | --------------------------------------------------------------- |
| `--port <n>`     | `PORT`, or 3000 | The public port.                                                |
| `--hostname <h>` | `0.0.0.0`       | The address to listen on.                                       |
| `--no-backup`    | backs up        | With PostgreSQL, skip `pg_dump` when the host backs up for you. |

Keep it running with your process manager. With systemd:

```ini
[Unit]
Description=My OTW CMS site
After=network.target

[Service]
WorkingDirectory=/srv/my-site
ExecStart=/usr/bin/npx cms serve --port 3000
Restart=always
User=www-data
EnvironmentFile=/srv/my-site/.env

[Install]
WantedBy=multi-user.target
```

Put a web server such as nginx or Caddy in front for HTTPS. `cms serve` tells the site to trust
its forwarded headers. See [Behind a reverse proxy](/hosting/reverse-proxy).

## How updates work

When an administrator starts an update under **Dashboard › Updates**, or the site installs a patch
release on its own:

1. **Plan.** The same check as `cms update`: newer versions, and whether every plugin supports
   them.
2. **Build.** A new release is installed and built in its own folder, while the current one keeps
   serving.
3. **Back up and migrate.** The database is backed up, then the update's migrations run.
4. **Start and check.** The new release starts, and has to answer before anything changes for
   visitors.
5. **Switch.** Visitors move to the new release. With PostgreSQL there's no downtime; with the
   embedded database, which only one process can open, visitors get a few seconds of "being
   updated" while the releases swap.

If any step fails, the old release keeps serving and the backup is restored. The site's
`package.json`, lockfile and managed route files are written back to its directory, so they
match what runs. The last three releases are kept, for rolling back.

`cms serve` checks for updates twice a day, and can install patch releases on its own; see
[Updating](/documentation/updates).

## The control port

The admin asks `cms serve` to update through a control port that listens on the loopback address
only, and needs a random token that `cms serve` gives the releases it starts. Nothing outside the
server can reach it, and starting an update still needs the `core.manage_updates` capability.

## Several servers

`cms serve` runs one server. For several, use PostgreSQL, deploy each release with your usual
tooling, and run `cms migrate` once per release; see [Database migrations](/hosting/migrations).
