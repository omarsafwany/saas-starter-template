---
sidebar_position: 2
---

# React Router

## What it is

Routing via the `react-router` package directly (v7's data-mode API surface, used here in its
simpler declarative form — no file-based routing, no route loaders/actions yet). Route
protection is layered on top with two small wrapper components.

## Why plain React Router over the alternatives

TanStack Router is a strong newer alternative with better type-safe routing, but React Router is
still the default most developers already know, and this template doesn't (yet) need typed route
params badly enough to justify the smaller ecosystem. Using it in declarative `<Routes>`/`<Route>`
form rather than adopting the full data-router (loaders/actions) keeps route definitions in one
readable file (`App.tsx`) instead of splitting fetch logic across route config — a reasonable
trade for a template's current size; a project that grows into needing route-level data loading
can adopt `createBrowserRouter` later without changing the auth-gating pattern below.

## Route tree

```tsx title="frontend/src/App.tsx"
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={
                <GuestOnlyRoute>
                  <Login />
                </GuestOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestOnlyRoute>
                  <Register />
                </GuestOnlyRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

## Auth-gating pattern

Two small wrapper components, not a router-level middleware, decide what a route needs:

```tsx title="frontend/src/components/auth/ProtectedRoute.tsx"
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <div className="...">Checking session…</div>
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <>{children}</>
}
```

`GuestOnlyRoute` (in the same folder) is the mirror image — it redirects an already-authenticated
user away from `/login`/`/register` to `/dashboard`. Both read session state from `useAuth()`
(backed by `AuthContext` — see [Better Auth](/backend/better-auth) for the server side of this).

The redirect passes the original location in `state={{ from: location }}`, so `Login` can send
the user back to wherever they were trying to go rather than always landing on `/dashboard`
after signing in — that `state.from.pathname` read lives in `Login.tsx`.

## Adding a new protected page

1. Add the page component under `frontend/src/pages/`.
2. Add a `<Route>` in `App.tsx`, wrapped in `<ProtectedRoute>` if it requires a session (or
   `<GuestOnlyRoute>` if it should only be reachable while logged out).
3. If it's a public, crawlable page, also add it to `frontend/seo.routes.mjs` — see
   [SEO & AEO](/frontend/seo-aeo).
