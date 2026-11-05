# Static variants prototype

A Next.js prototype of a statically generated home page in several variants (one per customer
target group), served without streaming.

[`docs/research.md`](docs/research.md) has the question, how elektramat.nl does it today, the
results and the alternatives we considered.

| App                       | Dev  | Prod | Approach                                                             |
| ------------------------- | ---- | ---- | -------------------------------------------------------------------- |
| `apps/precompute-pattern` | 3001 | 4001 | One URL; `proxy.ts` rewrites to a hidden `[segment]` route by cookie |

## Running

```sh
pnpm install

pnpm dev            # dev mode (or pnpm precompute-pattern:dev)
pnpm prod           # build, then serve the production build (or pnpm precompute-pattern:prod)

pnpm build          # build only
pnpm start          # serve the last build
```

Test static rendering and caching with a production build. `next dev` renders every request and
sends `Cache-Control: no-store`, so it hides how the variants are served. Dev and prod use
different ports, so both can run at the same time.

To see a variant without the browser, send the cookie, for example:

```sh
curl -sD - -b target_group=type_bouw http://localhost:4001/nl-BE -o /dev/null
```
