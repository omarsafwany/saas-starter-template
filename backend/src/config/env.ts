import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").default("postgresql://postgres:postgres@localhost:5432/app"),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required").default("dev-only-secret-change-me"),
  BETTER_AUTH_URL: z.string().min(1).default("http://localhost:4000"),
  FRONTEND_URL: z.string().min(1).default("http://localhost:5173"),

  // OAuth (PERPRO-7) — optional. Leave unset to run with email/password only;
  // social sign-in silently stays disabled until both id+secret are provided
  // for a given provider. Create real apps in the Google/GitHub developer
  // consoles and set these to enable it.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Email service (PERPRO-8) — optional. Without it, Better Auth's
  // sendResetPassword/sendVerificationEmail callbacks fall back to
  // console.log so auth flows still work end-to-end in dev.
  RESEND_API_KEY: z.string().optional(),

  // Observability (PERPRO-12) — optional. Without it, Sentry/Better Stack
  // reporting no-ops locally.
  BETTER_STACK_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = loadEnv();
