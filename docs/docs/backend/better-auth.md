---
sidebar_position: 3
---

# Better Auth

## What it is

[Better Auth](https://www.better-auth.com) handles authentication: email/password, session
cookies, optional OAuth (Google/GitHub), email verification, and password reset. It's configured
once in `backend/src/config/auth.ts` and consumed both by a thin Express router
(`backend/src/routes/auth.ts`) and by Better Auth's own catch-all handler for the parts our
router doesn't claim.

## Why Better Auth over the alternatives

Auth-as-a-service providers (Clerk, Auth0, Supabase Auth) mean the user table lives outside your
own database and outside Prisma's migration story — awkward for a template whose whole premise
is "one Postgres database, one Prisma schema." Rolling auth entirely by hand means reimplementing
session rotation, CSRF-safe cookies, and password reset token expiry correctly, which is exactly
the kind of security-sensitive plumbing a starter template should not ask a new project to redo.
Better Auth is a self-hosted, database-owned library — it uses Prisma as its adapter, so `User`,
`Session`, `Account`, and `Verification` are ordinary rows in your own database.

## How it's configured

```ts title="backend/src/config/auth.ts"
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.FRONTEND_URL],
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    // No real email service configured yet — allow login before the user
    // clicks a verification link so the flow isn't blocked in dev.
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        template: "reset-password",
        data: { url, name: user.name ?? undefined },
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        template: "verify-email",
        data: { url, name: user.name ?? undefined },
      });
    },
  },

  socialProviders, // see below

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // The welcome email is a background job (pg-boss), not a
          // synchronous send here — see Background Jobs.
          await enqueueWelcomeEmail({ email: user.email, name: user.name ?? undefined });
        },
      },
    },
  },

  // Plain string role column, default "user". Declared as an additional
  // field so Better Auth returns/accepts it on the session user object.
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "user", input: false },
    },
  },

  // Cookie sessions are Better Auth's default. The bearer plugin adds
  // token-mode auth (Authorization: Bearer <token>) on top, so a future
  // mobile/cross-origin client doesn't require retrofitting.
  plugins: [bearer()],
});
```

### OAuth is opt-in per provider

```ts
const socialProviders = {
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
    : {}),
  ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } }
    : {}),
};
```

A provider only registers once **both** its id and secret env vars are set, so the app boots
fine in dev with zero OAuth configuration — email/password just works, and social login stays
silently disabled until you create a real Google/GitHub OAuth app and set the four env vars.

### Role-based access

The `role` field defaults to `"user"`. There's no admin UI to change it yet — promote a user by
updating the row directly (`UPDATE "User" SET role = 'admin' WHERE email = '...'`) until a
project built on this template needs one.

## Routing

`app.ts` mounts two things for `/api/auth/*` (see [Express](/backend/express) for the full
picture): a thin custom router for register/login/logout/forgot-password/reset-password/me, and
Better Auth's own `toNodeHandler(auth)` as the fallback for everything else — principally OAuth
redirect/callback URLs and Better Auth's native sign-in endpoint.

## Frontend integration

The React app never talks to `/api/auth/*` directly from components — `AuthContext` (in
`frontend/src/context/`) owns the session state, and `useAuth()` plus `ProtectedRoute`/
`GuestOnlyRoute` gate routes on it. See [React Router](/frontend/react-router).
