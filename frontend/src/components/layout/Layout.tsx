import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-lg font-semibold">saas-starter-template</span>
          <nav className="text-sm text-muted-foreground">Frontend scaffold</nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t py-4">
        <div className="mx-auto max-w-5xl px-4 text-xs text-muted-foreground">
          PERPRO-14 scaffold
        </div>
      </footer>
    </div>
  )
}
