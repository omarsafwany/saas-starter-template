import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '@/lib/auth-client'
import { AuthContext, type AuthStatus } from './auth-context'

// Cross-tab sync: cookies are already shared automatically across tabs of
// the same browser, so a *new* tab naturally sees an existing session on
// its own mount fetch. The gap is *live* tabs that are already open and
// rendered - a stale authenticated tab won't know a logout happened
// elsewhere. We bridge that with two mechanisms:
//   1. `localStorage` + the `storage` event: every login/register/logout
//      writes a timestamp under this key, which fires a `storage` event in
//      every *other* same-origin tab (never the tab that wrote it), so they
//      can immediately revalidate.
//   2. Revalidating on window focus: a safety net for cases the storage
//      event can miss (e.g. a tab that was fully suspended/backgrounded by
//      the browser, or the session expiring server-side without any local
//      write happening at all).
const AUTH_BROADCAST_KEY = 'auth:broadcast'

function broadcastAuthChange() {
  try {
    localStorage.setItem(AUTH_BROADCAST_KEY, String(Date.now()))
  } catch {
    // localStorage can throw in private-browsing/storage-disabled contexts;
    // cross-tab sync is a nice-to-have, so fail silently rather than
    // breaking the auth action that triggered this.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Awaited<ReturnType<typeof fetchCurrentUser>>>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  // Revalidates against the backend without forcing callers through the
  // 'loading' state first - safe to call in the background (storage event,
  // window focus) without causing a visible flash for an already-resolved
  // tab.
  const refresh = useCallback(async () => {
    const current = await fetchCurrentUser()
    setUser(current)
    setStatus(current ? 'authenticated' : 'unauthenticated')
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchCurrentUser()
      .then((current) => {
        if (cancelled) return
        setUser(current)
        setStatus(current ? 'authenticated' : 'unauthenticated')
      })
      .catch(() => {
        if (cancelled) return
        setUser(null)
        setStatus('unauthenticated')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === AUTH_BROADCAST_KEY) {
        void refresh()
      }
    }

    function handleFocus() {
      void refresh()
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refresh])

  const login = useCallback(async (input: { email: string; password: string }) => {
    const { user: loggedInUser } = await loginUser(input)
    setUser(loggedInUser)
    setStatus('authenticated')
    broadcastAuthChange()
  }, [])

  const register = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const { user: registeredUser } = await registerUser(input)
      setUser(registeredUser)
      setStatus('authenticated')
      broadcastAuthChange()
    },
    [],
  )

  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
    setStatus('unauthenticated')
    broadcastAuthChange()
  }, [])

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
