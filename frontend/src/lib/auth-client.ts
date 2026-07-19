export interface AuthUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  role: string
  createdAt: string
  updatedAt: string
}

/**
 * The generic `better-auth/react` client posts to Better Auth's own default
 * REST paths (e.g. /sign-up/email), which this backend can't safely serve —
 * see backend/src/app.ts: express.json() is scoped to the whole /api/auth
 * prefix, so it would consume the request body before Better Auth's native
 * handler (which needs the raw stream) ever sees it. Instead we talk to the
 * backend's own thin-controller routes (backend/src/routes/auth.ts), which
 * are stable, JSON-friendly, and propagate Better Auth's session cookie via
 * applyHeaders(). All calls use credentials: "include" so the session
 * cookie flows through the Vite dev proxy in local development.
 */

export class AuthApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "AuthApiError"
    this.status = status
  }
}

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/auth${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  })

  const text = await res.text()
  const body = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && body.error) ||
      res.statusText ||
      "Request failed"
    throw new AuthApiError(String(message), res.status)
  }

  return body as T
}

export function registerUser(input: { name: string; email: string; password: string }) {
  return authFetch<{ user: AuthUser }>("/register", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function loginUser(input: { email: string; password: string }) {
  return authFetch<{ user: AuthUser }>("/login", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function logoutUser() {
  return authFetch<unknown>("/logout", { method: "POST" })
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const data = await authFetch<{ user: AuthUser }>("/me", { method: "GET" })
    return data.user
  } catch (err) {
    if (err instanceof AuthApiError && (err.status === 401 || err.status === 403)) {
      return null
    }
    throw err
  }
}
