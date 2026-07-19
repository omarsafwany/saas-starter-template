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
  EMAIL_FROM: z.string().optional(),

  // Observability (PERPRO-12) — optional. Without it, Sentry/Better Stack
  // reporting no-ops locally.
  BETTER_STACK_DSN: z.string().optional(),

  // File storage (PERPRO-9) — optional. Without all four set, services/
  // storage.ts's functions throw a clear "not configured" AppError only
  // when actually called (lazy, not at startup) - nothing else in the app
  // depends on R2 being present.
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),

  // Payments (PERPRO-10) - optional. Without POLAR_ACCESS_TOKEN/PRODUCT_ID,
  // services/payments.ts's functions throw a clear "not configured" AppError
  // only when actually called (lazy, not at startup) - same pattern as R2.
  // POLAR_WEBHOOK_SECRET is required to verify inbound webhook signatures.
  POLAR_ACCESS_TOKEN: z.string().optional(),
  POLAR_WEBHOOK_SECRET: z.string().optional(),
  POLAR_SERVER: z.enum(["sandbox", "production"]).default("sandbox"),
  POLAR_SUCCESS_URL: z.string().optional(),
  POLAR_PRODUCT_ID: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // Deliberately console.error, not the Pino logger: the logger module
    // itself imports this file's `env` export, so it cannot be used here
    // without a circular dependency on the very env we failed to load.
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = loadEnv();
