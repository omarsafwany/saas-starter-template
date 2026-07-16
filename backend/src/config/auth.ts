import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";

import { prisma } from "./db.js";
import { env } from "./env.js";

// Only register a social provider once BOTH its id and secret are set, so
// the app boots fine in dev with no OAuth configured at all (see PERPRO-7 —
// verifying real OAuth login requires a real Google/GitHub OAuth app, which
// isn't available yet; set the env vars below to turn a provider on).
const socialProviders = {
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        },
      }
    : {}),
};

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.FRONTEND_URL],
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    // No real email service yet (see PERPRO-8) — allow login before the
    // user clicks a verification link so the flow isn't blocked in dev.
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      // TODO(PERPRO-8): swap for services/email.ts sendEmail(...) once the
      // Resend wrapper lands.
      console.log(`[auth] password reset link for ${user.email}: ${url}`);
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      // TODO(PERPRO-8): swap for services/email.ts sendEmail(...) once the
      // Resend wrapper lands.
      console.log(`[auth] verification link for ${user.email}: ${url}`);
    },
  },

  socialProviders,

  // Plain string role column (PERPRO-7 scope), default "user". Declared as
  // an additional field so Better Auth returns/accepts it on the session
  // user object.
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
    },
  },

  // Cookie sessions are Better Auth's default. The bearer plugin adds
  // token-mode auth (Authorization: Bearer <token>) on top, so a future
  // mobile/cross-origin client doesn't require retrofitting.
  plugins: [bearer()],
});
