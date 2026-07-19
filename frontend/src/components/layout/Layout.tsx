import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { status, user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold">
            saas-starter-template
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            {status === 'authenticated' ? (
              <>
                <Link to="/dashboard" className="hover:text-foreground">
                  Dashboard
                </Link>
                <span className="hidden sm:inline">{user?.email}</span>
                <button type="button" onClick={() => logout()} className="hover:text-foreground">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-foreground">
                  Log in
                </Link>
                <Link to="/register" className="hover:text-foreground">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">{children}</main>
      <footer className="border-t py-4">
        <div className="mx-auto max-w-5xl px-4 text-xs text-muted-foreground">
          PERPRO-14 scaffold
        </div>
      </footer>
    </div>
  )
}
