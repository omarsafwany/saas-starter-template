import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '@/lib/auth-client'
import { AuthContext, type AuthStatus } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Awaited<ReturnType<typeof fetchCurrentUser>>>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

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

  const login = useCallback(async (input: { email: string; password: string }) => {
    const { user: loggedInUser } = await loginUser(input)
    setUser(loggedInUser)
    setStatus('authenticated')
  }, [])

  const register = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const { user: registeredUser } = await registerUser(input)
      setUser(registeredUser)
      setStatus('authenticated')
    },
    [],
  )

  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
