---
title: Behind a reverse proxy
description: Run a site behind nginx, Caddy or a load balancer, so the admin sees the address visitors use.
order: 6
---

Behind a reverse proxy, which handles HTTPS and passes requests on, the site sees the proxy's
request (`http://127.0.0.1:3000`) rather than the visitor's (`https://example.com`). The admin
checks that forms come from the site's own address, so until it knows the real one, **admin
forms answer 403**.

Tell it in one of two ways.

## Trust the proxy's headers

Set `CMS_TRUST_PROXY=1` when your own proxy sends `X-Forwarded-Host` and `X-Forwarded-Proto`. The
site then takes the visitor's address from them. Only do this behind a proxy you run: anyone can
send these headers to a site that's reachable directly. `cms serve` sets it for its releases,
since it's the proxy.

nginx:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Caddy sends the forwarded headers on its own:

```
example.com {
  reverse_proxy 127.0.0.1:3000
}
```

## Or set the site's address

Set `SITE_URL=https://example.com`, or **Site address** under **Settings › General**. The site then
accepts that address as its own, whatever the proxy sends. It's also the address used in links
that leave the site, such as the return pages of payment providers, so it's worth setting anyway.
