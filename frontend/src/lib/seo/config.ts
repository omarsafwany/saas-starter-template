/**
 * Single source of truth for site-wide SEO/AEO metadata (PERPRO-25).
 *
 * `SITE_URL` is read from `VITE_SITE_URL` so the same code produces correct
 * absolute URLs across local dev, preview deployments, and production
 * without hardcoding a host anywhere. It falls back to the local dev URL so
 * `npm run dev`/`npm run build` work out of the box before an idea sets its
 * real domain.
 *
 * This file, `components/seo/Seo.tsx`, and `components/seo/JsonLd.tsx` are
 * the reusable pattern new ideas built on this template should copy as-is
 * and extend (more FAQ items, more public routes) rather than re-deriving.
 */
export const SITE_NAME = "saas-starter-template";

export const SITE_URL = (
  import.meta.env.VITE_SITE_URL ?? "http://localhost:5173"
).replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "A reusable, batteries-included starter for indie hackers: an Express + Prisma backend and a React + Vite frontend, with auth, payments, background jobs, file storage, email, and observability already wired together, so a new idea can ship in days instead of weeks.";
