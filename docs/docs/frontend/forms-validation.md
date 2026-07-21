---
sidebar_position: 6
---

# Forms & Validation

## Status: decision recorded, not yet adopted on the frontend

This page is intentionally different from the others in this section: React Hook Form + Zod
is the project's stack decision for forms, but as of this writing no page has actually adopted
it yet — `Login.tsx` and `Register.tsx` still use plain `useState` + a manual `handleSubmit`.
This page documents the decision and the current reality honestly rather than showing a
hypothetical React Hook Form example that isn't actually running anywhere in the repo.

## The current pattern (Login.tsx)

```tsx title="frontend/src/pages/Login.tsx"
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState<string | null>(null)
const [submitting, setSubmitting] = useState(false)

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  setError(null)
  setSubmitting(true)
  try {
    await login({ email, password })
    navigate(redirectTo, { replace: true })
  } catch (err) {
    setError(err instanceof AuthApiError ? err.message : 'Unable to log in. Please try again.')
  } finally {
    setSubmitting(false)
  }
}
```

This works, and it's what shipped the auth UI (PERPRO-15/27) fastest at the time. It doesn't do
client-side field validation before submit — the backend's Zod schemas (see below) are the only
validation that actually runs, surfaced as a generic error message rather than per-field errors.

## Why React Hook Form + Zod is still the recorded decision

For a form-heavy SaaS app, hand-rolling `useState` per field doesn't scale past a couple of
simple forms — React Hook Form avoids a re-render per keystroke (uncontrolled inputs under the
hood) and gives per-field error state for free. Zod over a different validation library because
the **backend already uses Zod** for every request schema (see below) — `@hookform/resolvers`'s
`zodResolver` means the exact same schema (or a client-safe subset of it) can validate a form
before submit, instead of maintaining two parallel validation implementations that can drift.

## What Zod validation looks like today (backend only)

```ts title="backend/src/modules/items/items.schema.ts"
export const createItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().optional(),
});
```

Every module's `*.schema.ts` defines its Zod schemas, and the controller parses `req.body`
against them, returning a 400 with `fieldErrors` on failure (see `items.test.ts` in
[Testing](/backend/testing) for the shape of that response). This is real, running validation —
it's specifically the *frontend* half (pre-submit, per-field UI validation via React Hook Form)
that hasn't been built yet.

## Adopting it for a new form

1. `npm install react-hook-form @hookform/resolvers` in `frontend/` (not yet a dependency).
2. Reuse or mirror the relevant backend Zod schema — either import it directly if the module is
   set up to share types between backend/frontend, or define an equivalent client-side schema.
3. Wire `useForm({ resolver: zodResolver(schema) })` and replace manual `useState` fields with
   registered inputs.
4. Once a form is converted, consider whether `Login`/`Register` should be migrated too, to keep
   one pattern rather than two live side by side.
