import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FaqJsonLd, OrganizationJsonLd, type FaqItem } from "@/components/seo/JsonLd";
import { Seo } from "@/components/seo/Seo";
import { SITE_DESCRIPTION } from "@/lib/seo/config";

type HealthState =
  | { status: "loading" }
  | { status: "ok"; body: string }
  | { status: "error"; message: string };

// Visible FAQ copy, reused for both the on-page <dl> and the FaqJsonLd
// structured data below -- keep these two in sync (see PERPRO-25).
const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is saas-starter-template?",
    answer:
      "A reusable, batteries-included starter for indie hackers: an Express + Prisma backend and a React + Vite frontend, with auth, payments, background jobs, file storage, email, and observability already wired together, so a new idea can ship in days instead of weeks.",
  },
  {
    question: "What is this page?",
    answer:
      "This is the public home route scaffolded in PERPRO-14. It also doubles as a working example: the card below calls the backend health endpoint through the Vite dev server proxy, so the frontend and backend can be seen talking to each other on first run.",
  },
  {
    question: "Is the authenticated app crawlable too?",
    answer:
      "No, deliberately not. Only public routes like this one are meant to be indexed; everything behind login is app functionality rather than content, and is excluded from the sitemap.",
  },
];

export function Home() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false

    fetch('/health')
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
  }, [reloadToken]);

  const handleRecheck = () => {
    setHealth({ status: "loading" });
    setReloadToken((t) => t + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <Seo title="Welcome" description={SITE_DESCRIPTION} path="/" />
      <OrganizationJsonLd />
      <FaqJsonLd items={FAQ_ITEMS} />

      <div>
        <h1 className="text-2xl font-semibold">saas-starter-template</h1>
        <p className="text-sm text-muted-foreground">{SITE_DESCRIPTION}</p>
      </div>

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
            fetch(&quot;/health&quot;) through the Vite dev server proxy to
            localhost:4000
          </CardDescription>
        </CardHeader>
        <CardContent>
          {health.status === "loading" && <p>Checking…</p>}
          {health.status === "ok" && (
            <pre className="rounded-md bg-muted p-3 text-sm">{health.body}</pre>
          )}
          {health.status === "error" && (
            <p className="text-sm text-destructive">{health.message}</p>
          )}
        </CardContent>
      </Card>

      <section aria-labelledby="faq-heading" className="flex flex-col gap-4">
        <h2 id="faq-heading" className="text-lg font-semibold">
          Frequently asked questions
        </h2>
        <dl className="flex flex-col gap-4">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question}>
              <dt className="font-medium">{item.question}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
