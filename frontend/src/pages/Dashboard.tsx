import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

export function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Protected route — only visible to signed-in users.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="text-sm">
            <p>
              Signed in as <span className="font-medium">{user?.name}</span>
            </p>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" className="w-fit" onClick={() => logout()}>
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
