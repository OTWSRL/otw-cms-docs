---
title: Docker
description: Build a site into a small container image with the Dockerfile every new site includes, and migrate with its migrate target.
order: 3
---

Every new site has a `Dockerfile` for a single container: the embedded database in a volume, and
migrations at startup. The image holds Next.js's standalone server, the server and only the files
it uses, so it's small: the site adds about 65 MB to Node.js's image, where copying the whole
install would add over 500 MB. It's written for the package manager the site was created with.
With npm:

```dockerfile
FROM node:24-slim AS build
WORKDIR /site
COPY . .
ENV CMS_STANDALONE=1
# public/ is optional in a site, but the last stage copies it.
RUN npm ci && npm run build && mkdir -p public

# `cms migrate`, with the whole install the command needs. Arguments after the image's name are
# its options.
FROM build AS migrate
ENTRYPOINT ["npx", "cms", "migrate"]

FROM node:24-slim
WORKDIR /site
# HOSTNAME: Docker sets it to the container's id, which the server would listen on alone.
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 CMS_DATA_DIR=/data/pglite CMS_UPLOADS_DIR=/data/uploads
COPY --from=build /site/.next/standalone ./
COPY --from=build /site/.next/static ./.next/static
COPY --from=build /site/public ./public
VOLUME /data
EXPOSE 3000
CMD ["node", "server.js"]
```

- **The build stage** installs and builds. [`CMS_STANDALONE=1`](/hosting/environment-variables#cms_standalone)
  makes the build write the standalone server.
- **The last stage** is the image: Node.js, the standalone server and the site's static files. No
  package manager, and no `node_modules` beyond what the server uses.
- **The `migrate` stage** runs `cms migrate`, for [several containers](#several-containers).

With the other package managers, only the build stage's commands and the `migrate` stage's
command differ:

| Created with | Build stage                                                                  | `migrate` runs     |
| ------------ | ---------------------------------------------------------------------------- | ------------------ |
| npm          | `npm ci && npm run build`                                                    | `npx cms migrate`  |
| pnpm         | `corepack enable && pnpm install --frozen-lockfile && pnpm build`            | `pnpm cms migrate` |
| Yarn         | `corepack enable && yarn install --immutable && yarn build`                  | `yarn cms migrate` |
| Bun          | `npm install --global bun && bun install --frozen-lockfile && bun run build` | `bunx cms migrate` |

Build and run it:

```bash
docker build -t my-site .
docker run -d -p 3000:3000 -v my-site-data:/data --env-file .env my-site
```

The volume holds the database and the media library's files. Keep it, and back it up.

## Several containers

The embedded database belongs to one process, so for several containers:

1. Set `DATABASE_URL` to a PostgreSQL server, and `CMS_MIGRATIONS=deploy`. Uploads need a place
   every container shares: a shared volume for `/data/uploads`, or a storage plugin.
2. For each release, migrate once, before the new containers start, with the `migrate` target:

   ```bash
   docker build --target migrate -t my-site-migrate .
   docker run --rm --env-file .env my-site-migrate --no-backup
   ```

3. Then roll out the new containers.

## Updating

A container's code is its image, so the admin can't update it. Update the site's dependencies
(see [Updating a site](/hosting/updates)), commit, and build and deploy a new image.

## Sites made before 1.1

Their `Dockerfile` copies the whole site into the image and starts it with the package manager. It
still works. For the smaller image, replace it with a new site's, or make the same changes:
`ENV CMS_STANDALONE=1` in the build stage, and the last stage above.
