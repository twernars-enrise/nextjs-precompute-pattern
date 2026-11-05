# Static home page variants per target group

Can Next.js serve a home page that differs per target group, statically generated, so that a CDN
can cache it? This repo answers that with a working prototype in `apps/precompute-pattern`. This
document gives the question, how elektramat.nl does it today, the approach we built, what we
found, and the alternatives we considered.

## The question

From the Confluence page
[Storefront: open technische vragen](https://enrise.atlassian.net/wiki/spaces/ELEK/pages/6108446788/Storefront+open+technische+vragen),
section "Statische varianten per customer group":

> According to Robin there will be five flavours of the website, each with a slightly different
> home page. Can Next.js generate all of them statically, so that a CDN caches them?

Scope:

- The five flavours are the five **target groups** of elektramat.nl (see below). With the state
  "no choice yet" (`default`) there are **six** variants. With two locales (`nl-BE`, `fr-BE`),
  that is twelve pages.
- The home page **must stay statically generated**. No streaming and no Partial Prerendering hole
  for the variant: the visitor gets complete HTML in one response.
- This is research, not an ADR. It shows what is technically possible in Next.js. It does not
  have to match the new storefront setup or copy how Magento does it today.

Related questions on the same Confluence page, not covered here: "Prijzen per customer group en
de cachesleutel" (if prices differ per group, every product page is personal) and "Next.js
caching en Cloudflare" (a broken render can land in the cache once per variant).

## How elektramat.nl does it today

Researched on 2026-11-04 with a browser and raw HTTP requests. The site is Magento 2 with the Hyvä
theme (Alpine.js), behind Cloudflare.

### Target groups

The header has a dropdown "Kies je weergave", and a modal asks the same after cookie consent:

| Code                   | Label              | Type     | VAT shown |
| ---------------------- | ------------------ | -------- | --------- |
| `type_particulier`     | Particulier        | private  | incl. btw |
| `type_e-installatie`   | E-installateur     | business | excl. btw |
| `type_w-installatie`   | W-installateur     | business | excl. btw |
| `type_bouw`            | Bouw & constructie | business | excl. btw |
| `type_anders_zakelijk` | Anders zakelijk    | business | excl. btw |

These are Magento's segmentation target groups. They are not Magento customer groups, which
belong to logged-in accounts and pricing.

### Where the choice is stored

- Selecting sends `POST /segmentation/targetgroup/save/` with `form_key` and `target_group`. The
  group is stored in the **PHP session** (`PHPSESSID`), not in its own cookie.
- Magento then sets `private_content_version`, and the browser reloads its customer data from
  `/customer/section/load`. That returns
  `{"segmentation":{"targetGroup":"type_e-installatie","type":"business"}}`.
- A copy goes to localStorage (`elektramat_segmentation_target_group`). "Kies later" sets the
  cookie `website_type_dismiss`.

### URLs and caching

- The URL is the same for every group.
- No `X-Magento-Vary` cookie is set, so the group is not part of the cache key.
- Cloudflare does not cache the HTML (`cf-cache-status: DYNAMIC`, `cache-control: no-store`).
  Magento's full page cache serves it (`x-magento-cache-debug: HIT`).
- The raw HTML of the home page is **byte-identical** for an anonymous visitor and an
  e-installateur.

### How the variants appear

All of it happens in the browser, after the customer data loads (`private-content-loaded` event):

- **Hero banner.** A wrapper with `x-data="initPersonalizedElement"` holds every variant as a
  child. `data-child-configs` maps each child to `target_groups`, and optionally to
  `login_states` (`logged_in` / `not_logged_in`): `child_0` is `default` and `type_particulier`,
  `child_1` is the four business groups. This is the only personalized block on the home page.
- **USP bar.** One list per group (`data-listy="main.usps.type_bouw"`, …, plus a default). A
  script unhides the matching one.
- **VAT.** Every price renders both `price-incl-tax` and `price-excl-tax`. A class
  `vat-display-including|excluding` on `<body>` picks one, and the class is stored in
  localStorage (`adwise-vat-display`). The default is excl.

The result is one static page that contains every variant, plus a client-side switch. The
downside is a flash of the default content before the group is known.

## The approach: precompute pattern

`apps/precompute-pattern` keeps one URL per page and prerenders one HTML file per variant.

- A route `app/[locale]/[segment]/page.tsx` with `generateStaticParams` for all six segments.
- `proxy.ts` reads the cookie `target_group` and rewrites `/nl-BE` to a hidden route such as
  `/nl-BE/type_bouw`. The browser keeps seeing `/nl-BE`. Direct requests to the hidden route are
  redirected to `/nl-BE`.
- A switcher sets the cookie in the browser and calls `router.refresh()`, because the client
  router caches by URL.

This is the [precompute pattern](https://flags-sdk.dev/frameworks/next/precompute) of Vercel's
Flags SDK. The SDK encodes several flags into one signed code. For one value with six options we
do not need it.

A `rewrites` entry in `next.config.ts` with `has: [{ type: "cookie", key, value }]` can do the
same rewrite without code, but it cannot redirect the hidden routes. See the app README.

### Results

Tested with `next build` and `next start` on Next.js 16.4.3. Details and commands are in
[`apps/precompute-pattern/README.md`](../apps/precompute-pattern/README.md).

- All twelve pages are fully static. None of them leaves work for request time.
- A request with each cookie value gets the prerendered HTML of its variant, byte for byte, in one
  response, with `x-nextjs-cache: HIT` and `Cache-Control: s-maxage=31536000`.
- Client-side navigation (RSC requests) goes through the same rewrite and gets the right variant.
- Switching group shows the new variant without a full reload. The URL stays `/nl-BE`.
- There is no flash of default content, unlike today's site: the server already sends the right
  variant.

### Open: the CDN

The response does not vary on the cookie, and it tells a CDN to cache `/nl-BE` for a year.
Cloudflare caches by URL and ignores `Vary: Cookie`, so it would serve the first visitor's variant
to everyone. Possible ways out, none tested yet:

1. A Cloudflare URL rewrite rule on `http.cookie` that does the same rewrite before the cache.
   Rewrite rules exist on every plan. **Not verified** that the cache key uses the rewritten URL.
2. The cookie in the cache key. That is
   [Enterprise only](https://developers.cloudflare.com/cache/how-to/cache-keys/).
3. A Cloudflare Worker that rewrites the URL before the cache.
4. Do not cache the home page in Cloudflare. Next.js still serves the stored HTML without
   rendering it.

Whether option 1 works decides whether this approach works behind Cloudflare without a Worker or
an Enterprise plan.

## Alternatives considered

These were not built.

### A visible URL per group

The same static route, but visible: for example `/nl-BE/zakelijk`. Any CDN caches it without
extra setup, because every variant has its own URL.

Trade-offs:

- `/nl-BE` and every internal link must lead to the right group. A cookie-based redirect from
  `/nl-BE` costs a round trip, and that redirect must not be cached itself.
- Several URLs with nearly the same content need canonicals against duplicate content.
- It changes the URL structure of the site, which the other options do not.

### One static page, variant picked before the first paint

The build renders every hero and USP variant into one page. An inline script in `<head>` reads
the cookie (or localStorage) and sets `data-segment` on `<html>`. CSS shows only the matching
variant, so there is no flash, unlike today's site. This is close to what Magento does now.

Trade-offs:

- Every page carries the HTML of every variant.
- Hidden images still download unless they are lazy-loaded.
- Crawlers see every variant.
- The inline script needs a CSP hash, and `<html>` needs `suppressHydrationWarning`.
- It only works while the differences stay small, such as a banner and USPs. It does not scale
  to prices or assortment.

### A streamed part per group (Partial Prerendering)

The default Next.js answer for per-visitor content: a static shell with a dynamic hole that reads
the cookie. Ruled out, because the variant would be streamed instead of being in the first
response.

## Next.js notes

From the docs bundled with Next.js 16.4.3 (`node_modules/next/dist/docs/`) and from building the
prototype:

- With Cache Components, `export const dynamicParams = false` **fails the build**
  (`migrating-to-cache-components.md`). Unknown params render on request instead; call
  `notFound()` for a value that is not a real segment.
- With Cache Components, `generateStaticParams` must return at least one value.
- Order of execution: `next.config` headers and redirects, then `proxy.ts`, then `beforeFiles`
  rewrites, then the file system routes (`proxy.md`).
- The build output keeps a `◐` line per dynamic route (`◐ /[locale]/[segment]`). That is the
  fallback shell for param values not in `generateStaticParams`. The output also collapses long
  path lists into `◐ [+10 more paths]`, which looks like Partial Prerendering but is not. To check
  that a page is fully static, look for a `postponed` key in its
  `.next/server/app/<path>.meta`: a fully static page has none.
- `next dev` sends `Cache-Control: no-store` and renders every request. Test caching with a
  production build.
- After `router.refresh()` changes the variant, the router keeps the previous variant mounted but
  hidden (`<Activity>`), because the rewritten route param changed.
