/**
 * Thin fetch wrapper for the backend's general-purpose /api surface (as
 * opposed to lib/auth-client.ts, which is scoped to /api/auth). Same shape
 * on purpose: relative base URL (the Vite dev proxy forwards /api/* to the
 * backend unchanged, see vite.config.ts), credentials always included so the
 * session cookie rides along, JSON in/out, and a typed error so callers can
 * branch on HTTP status without parsing strings.
 */

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  })

  // DELETE responses (204) and other empty bodies have nothing to parse.
  const text = await res.text()
  const body = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && body.error) ||
      res.statusText ||
      "Request failed"
    throw new ApiError(String(message), res.status)
  }

  return body as T
}
