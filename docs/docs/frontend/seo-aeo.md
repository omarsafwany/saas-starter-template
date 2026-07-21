---
sidebar_position: 7
---

# SEO & AEO

## What it is

A dependency-free pattern for per-page metadata (title, description, canonical, Open Graph,
Twitter card) and structured data (JSON-LD), plus a generator script that keeps `sitemap.xml`,
`robots.txt`, and an `llms.txt` file in sync with the app's actual public routes. Scoped
deliberately to public, indexable pages only (`/`) — authenticated pages like `/dashboard` are
`noindex` by design, since there's nothing for a crawler or an answer engine to usefully cite
behind a login wall.

## Why this approach over a library

React 19 natively hoists `<title>`, `<meta>`, and `<link>` tags rendered anywhere in the
component tree into `<head>` — no `react-helmet-async` or similar package needed (see
[Vite + React](/frontend/vite-react)). For a template meant to be reused, one fewer dependency to
version-bump is a real win. The one architectural limit worth knowing: this is still a
client-rendered SPA, so a crawler that doesn't execute JavaScript sees an empty shell on first
paint. That's an acceptable trade at this stage — Google and most modern crawlers do execute JS —
with a documented escape hatch (a framework like Astro for the marketing/public pages
specifically) if a project's SEO needs outgrow it later.

## The Seo component

```tsx title="frontend/src/components/seo/Seo.tsx"
export function Seo({
  title, description, path, image, type = "website", noindex = false,
}: SeoProps) {
  const url = `${SITE_URL}${path}`
  const fullTitle = `${title} | ${SITE_NAME}`
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
    </>
  )
}
```

Used per-page like:

```tsx title="frontend/src/pages/Home.tsx"
<Seo title="Welcome" description={SITE_DESCRIPTION} path="/" />
<OrganizationJsonLd />
<FaqJsonLd items={FAQ_ITEMS} />
```

```tsx title="frontend/src/pages/Login.tsx"
<Seo title="Log in" description="Log in to your account." path="/login" noindex />
```

## JSON-LD without `dangerouslySetInnerHTML`

```tsx title="frontend/src/components/seo/JsonLd.tsx"
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json">{JSON.stringify(data)}</script>
}
```

Rendering `JSON.stringify(data)` as a plain JSX child inserts it via a DOM text node
(`textContent`), not through HTML parsing — this sidesteps the classic
`</script>`-embedded-in-a-JSON-string injection risk that `dangerouslySetInnerHTML`-based JSON-LD
helpers otherwise have to guard against, and needs no extra escaping logic to do it.

## Heading hierarchy convention

Every **public, indexable** page renders exactly one real `<h1>` (its visible title, distinct
from the `<title>` tag `Seo` manages), with `<h2>`/`<h3>` nesting below it in document order,
never skipping a level. `noindex` auth screens (Login/Register) aren't held to this. Note that
shadcn's `<CardTitle>` renders a styled `<div>`, not a heading element — wrap real page/section
titles in actual `<h1>`–`<h6>` tags yourself; see `Home.tsx` for the reference example.

## Generated files stay in sync automatically

```js title="frontend/seo.routes.mjs"
export const PUBLIC_ROUTES = [{ path: "/", changefreq: "weekly", priority: 1.0 }]
```

`frontend/scripts/generate-seo-files.mjs` reads this single source of truth and writes
`public/sitemap.xml`, `public/robots.txt`, and `public/llms.txt`. It runs automatically via
`predev`/`prebuild` npm hooks — see [Vite + React](/frontend/vite-react) — so these files can
never silently drift from the app's actual routes. Adding a new public page means adding one
entry to `PUBLIC_ROUTES`, not hand-editing three generated files.

## Adding SEO to a new public page

1. Render `<Seo title="..." description="..." path="..." />` near the top of the page.
2. Add a real `<h1>` for the page's visible title.
3. Add the route to `PUBLIC_ROUTES` in `seo.routes.mjs` if it should be crawlable.
4. Add `OrganizationJsonLd`/`FaqJsonLd` or a new `JsonLd` helper if the page has structured data
   worth marking up (FAQs, articles, products).
