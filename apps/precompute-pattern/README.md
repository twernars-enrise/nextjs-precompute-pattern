# Precompute pattern

The [precompute pattern](https://flags-sdk.dev/frameworks/next/precompute) of Vercel's Flags SDK,
without the SDK: the proxy works out the visitor's value and rewrites to a route that is
prerendered for every possible value. With one value and six options, the SDK's encoding of
several flags into one signed code is not needed.

One URL for every target group. `proxy.ts` reads the target group from a cookie and rewrites
`/nl-BE` to a hidden route such as `/nl-BE/type_bouw`. `generateStaticParams` prerenders one
static page per locale and target group, so the visitor gets complete HTML without streaming.

Runs on port 3001 (dev) and 4001 (prod, `pnpm precompute-pattern:prod` from the repo root).

## How it works

- `src/segment.ts` lists the six segments: the five target groups of elektramat.nl plus
  `default` ("no choice yet").
- `src/app/[locale]/[segment]/page.tsx` renders the home page for one segment: a private or
  business hero, a USP bar per group, and a sample price incl. or excl. VAT.
  `ensureStatic = "navigation"` fails the build if the page ever needs request data.
- `src/proxy.ts`, after the locale check:
  - `/<locale>` is rewritten to `/<locale>/<segment>`. The segment comes from the cookie
    `target_group` (named after Magento's form field). A missing or unknown value gives
    `default`.
  - `/<locale>/<segment>` is redirected (307) to `/<locale>`. The variant paths are internal, so
    there is one URL per page and a CDN cannot cache the variants under their own URLs.
- `src/app/[locale]/group-switcher.tsx` sets the cookie with `document.cookie` and calls
  `router.refresh()`. A Server Action would post to `/<locale>`, and the proxy would rewrite that
  request with the old cookie. Other pages, such as `/info`, are the same for every group, so the
  switcher there reads the cookie in the browser after hydration (`useSyncExternalStore`). The
  select is empty in the static HTML until then.
- `src/app/[locale]/info/page.tsx` is a second static page to test client-side navigation.

### Alternative without code

A `beforeFiles` rewrite in `next.config.ts` can do the same rewrite:

```ts
rewrites: async () => ({
  beforeFiles: [
    {
      source: "/:locale(nl-BE|fr-BE)",
      has: [{ type: "cookie", key: "target_group", value: "(?<group>type_[a-z_-]+)" }],
      destination: "/:locale/:group",
    },
    { source: "/:locale(nl-BE|fr-BE)", destination: "/:locale/default" },
  ],
}),
```

It cannot block the hidden paths, and an unknown cookie value gives a 404 instead of `default`.
Not built here, so that only one mechanism does the work.

## Findings (`next build` + `next start`, Next.js 16.4.3)

- **Twelve static pages.** Each `.next/server/app/<locale>/<segment>.meta` has no `postponed`
  state, so nothing is left for request time. Only the `[locale]/[segment]` fallback shell has
  one. The build output collapses ten of the pages into `◐ [+10 more paths]`, which looks like
  Partial Prerendering but is not: check the `.meta` files, not the tree.
- **Complete HTML in one response.** `curl -b target_group=<group> /nl-BE` returns the
  prerendered file byte for byte for all six groups and both locales, with no streaming markers.
  Headers: `x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`, `Cache-Control: s-maxage=31536000`,
  `x-middleware-rewrite: /nl-BE/type_bouw`.
- **Client navigation.** RSC requests to `/nl-BE?_rsc=…` go through the rewrite and get the
  right variant from the prerender. The browser never requests `/nl-BE/type_bouw`.
- **Switching group.** `router.refresh()` sends one RSC request and shows the new variant while
  the URL stays `/nl-BE`. Switching on another page (`/info`) and following a `<Link>` home also
  shows the new variant; there was no stale client cache.
- **Old variants stay in the DOM.** The router sees `/nl-BE/default` → `/nl-BE/type_bouw` as a
  route change and keeps the previous page mounted but hidden (`<Activity>`, `display: none`).
  Harmless, but tests must select visible elements only.
- **`next dev` differs.** In dev the same request gets `Cache-Control: no-store`. Test caching
  with `next start`.

## Open: the CDN

`Vary` does not include `Cookie`, and `Cache-Control: s-maxage=31536000` invites the CDN to
cache `/nl-BE`. Behind Cloudflare, the first visitor's variant would be served to everyone,
unless the rewrite happens before the cache (a Cloudflare URL rewrite rule on `http.cookie`, or a
Worker). Until that is tested, do not cache the home page in Cloudflare.
