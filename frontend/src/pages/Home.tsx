import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type HealthState =
  | { status: 'loading' }
  | { status: 'ok'; body: string }
  | { status: 'error'; message: string }

export function Home() {
  const [health, setHealth] = useState<HealthState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetch('/api/health')
      .then(async (res) => {
        const text = await res.text()
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`)
        if (!cancelled) setHealth({ status: 'ok', body: text })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setHealth({
            status: 'error',
            message: err instanceof Error ? err.message : String(err),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const handleRecheck = () => {
    setHealth({ status: 'loading' })
    setReloadToken((t) => t + 1)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Placeholder home route for the frontend scaffold (PERPRO-14).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRecheck}>Re-check backend health</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backend proxy check</CardTitle>
          <CardDescription>
            fetch(&quot;/api/health&quot;) through the Vite dev server proxy to
            localhost:4000
          </CardDescription>
        </CardHeader>
        <CardContent>
          {health.status === 'loading' && <p>Checking…</p>}
          {health.status === 'ok' && (
            <pre className="rounded-md bg-muted p-3 text-sm">{health.body}</pre>
          )}
          {health.status === 'error' && (
            <p className="text-sm text-destructive">{health.message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
