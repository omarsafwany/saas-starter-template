---
sidebar_position: 1
---

# Vite + React

## What it is

The frontend is a React 19 single-page app built with Vite 8 (the Rolldown-based version) —
no server-side rendering, no Next.js/Remix meta-framework.

## Why Vite + a plain SPA over the alternatives

A meta-framework like Next.js buys server-rendering and file-based routing, but at the cost of
a much bigger surface area (server components, route handlers, the App Router's caching model)
for a template whose backend is already a separate Express API. A plain Vite SPA keeps "frontend"
and "backend" as two genuinely independent deployables talking JSON over HTTP — closer to what
most indie SaaS projects actually ship, and simpler to reason about when something breaks.
Vite over Create React App (unmaintained) or webpack directly for its dev-server speed and
because it's the de facto standard for new non-meta-framework React projects today.

## Entry point

```tsx title="frontend/src/main.tsx"
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
```

`QueryClientProvider` wraps the whole app here rather than deeper in the tree — every page can
use TanStack Query hooks without re-threading a provider (see
[TanStack Query](/frontend/tanstack-query)).

## React 19 features actually used

Two React 19 capabilities are load-bearing in this template, not just "available":

- **Native `<title>`/`<meta>`/`<link>` hoisting** — any component can render these tags anywhere
  in the tree and React hoists them into `<head>` automatically. This is what the `Seo` component
  is built on, with zero extra dependency like `react-helmet-async`. See [SEO & AEO](/frontend/seo-aeo).
- **`useActionState`/form actions are available** but not yet adopted — see
  [Forms & Validation](/frontend/forms-validation) for the current state of form handling and
  what's still a manual pattern.

## Path aliases

Imports use `@/` for `frontend/src/` (e.g. `@/components/ui/button`, `@/hooks/useAuth`) — see
`frontend/vite.config.ts` and `tsconfig.app.json` for the alias configuration. Follow this
convention for new files instead of relative `../../` imports.

## Build & dev scripts

```bash
npm run dev      # Vite dev server, runs predev (regenerates SEO files) first
npm run build     # tsc -b && vite build; also runs prebuild first
npm run lint      # ESLint 9 flat config
npm run test:e2e  # Playwright, boots both apps against a test DB
```

There is no separate `typecheck` script — `npm run build`'s `tsc -b` step covers type-checking,
which is also what CI runs (see [CI](/infrastructure/ci)).
