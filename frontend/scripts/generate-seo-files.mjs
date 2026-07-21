#!/usr/bin/env node
// Generates public/sitemap.xml, public/robots.txt, and public/llms.txt
// (PERPRO-25) from a single route config (seo.routes.mjs) and the
// VITE_SITE_URL env var. Runs automatically before `dev` and `build` (see
// package.json's predev/prebuild) so these files can never drift out of
// sync with the site's actual routes and URL. This is the reusable
// pattern: new ideas built on this template should add routes to
// PUBLIC_ROUTES rather than hand-editing XML/txt files.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLIC_ROUTES } from "../seo.routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public");
const SITE_URL = (process.env.VITE_SITE_URL ?? "http://localhost:5173").replace(
  /\/$/,
  "",
);
const SITE_NAME = "saas-starter-template";

mkdirSync(PUBLIC_DIR, { recursive: true });

function generateSitemap() {
  const urls = PUBLIC_ROUTES.map(
    (route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`,
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function generateRobots() {
  return `User-agent: *
Allow: /
Disallow: /dashboard

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function generateLlmsTxt() {
  const routeLines = PUBLIC_ROUTES.map(
    (route) => `- [${SITE_URL}${route.path}](${SITE_URL}${route.path})`,
  ).join("\n");

  return `# ${SITE_NAME}

> A reusable, batteries-included starter for indie hackers: an Express + Prisma backend and a React + Vite frontend, with auth, payments, background jobs, file storage, email, and observability already wired together, so a new idea can ship in days instead of weeks.

## Public pages

${routeLines}

## Notes for crawlers

Everything else on this domain requires authentication and is application
functionality, not published content. It is intentionally excluded from
this file and from sitemap.xml, and disallowed in robots.txt.
`;
}

writeFileSync(join(PUBLIC_DIR, "sitemap.xml"), generateSitemap());
writeFileSync(join(PUBLIC_DIR, "robots.txt"), generateRobots());
writeFileSync(join(PUBLIC_DIR, "llms.txt"), generateLlmsTxt());

console.log(`[seo] generated sitemap.xml, robots.txt, llms.txt for ${SITE_URL}`);
