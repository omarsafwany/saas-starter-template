/**
 * Single source of truth for which routes are public and should be
 * indexed (PERPRO-25). Drives sitemap.xml and llms.txt generation in
 * scripts/generate-seo-files.mjs.
 *
 * Keep this in sync with the public <Route> entries in src/App.tsx.
 * Authenticated routes (e.g. /dashboard) do not belong here -- they're
 * excluded from the sitemap and disallowed in robots.txt on purpose; see
 * the PERPRO-25 ticket for why this template does not try to make the
 * authenticated app crawlable.
 */
export const PUBLIC_ROUTES = [{ path: "/", changefreq: "weekly", priority: 1.0 }];
