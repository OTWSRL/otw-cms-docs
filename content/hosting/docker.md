---
title: Docker
description: Build a site into a container image with the Dockerfile every new site includes.
order: 3
---

Every new site has a `Dockerfile` for a single container: the embedded database in a volume, and
migrations at startup. It's written for the package manager the site was created with. With npm:

```dockerfile
FROM node:24-slim AS build
WORKDIR /site
COPY . .
RUN npm ci && npm run build

FROM node:24-slim
WORKDIR /site
ENV NODE_ENV=production CMS_DATA_DIR=/data/pglite
COPY --from=build /site /site
VOLUME /data
EXPOSE 3000
CMD ["npm", "start"]
```

With the others, the build stage installs and builds with their commands, and the final stage
makes the package manager available to start the site:

| Created with | Build stage                                                                  | Final stage                |
| ------------ | ---------------------------------------------------------------------------- | -------------------------- |
| npm          | `npm ci && npm run build`                                                    | (nothing to install)       |
| pnpm         | `corepack enable && pnpm install --frozen-lockfile && pnpm build`            | `corepack enable`          |
| Yarn         | `corepack enable && yarn install --immutable && yarn build`                  | `corepack enable`          |
| Bun          | `npm install --global bun && bun install --frozen-lockfile && bun run build` | `npm install --global bun` |

Build and run it:

```bash
docker build -t my-site .
docker run -d -p 3000:3000 -v my-site-data:/data --env-file .env my-site
```

The volume holds the database. Keep it, and back it up.

## Several containers

The embedded database belongs to one process, so for several containers:

1. Set `DATABASE_URL` to a PostgreSQL server, and `CMS_MIGRATIONS=deploy`.
2. For each release, run `cms migrate` once, before the new containers start, for example as a
   one-off container: `docker run --rm --env-file .env my-site npx cms migrate --no-backup`.
3. Then roll out the new containers.

## Updating

A container's code is its image, so the admin can't update it. Update the site's dependencies
(see [Updating a site](/hosting/updates)), commit, and build and deploy a new image.
