import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'

/**
 * Inverse of ProtectedRoute: for /login and /register. An already
 * authenticated user landing here (e.g. via back-button, a stale bookmark,
 * or a deep link) is sent to /dashboard instead of being shown the auth
 * forms again. Like ProtectedRoute, this must not decide anything while
 * status is still 'loading' - otherwise a logged-in user would see a flash
 * of the login form before being redirected.
 */
export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
        Checking session…
      </div>
    )
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
