import { SITE_NAME, SITE_URL } from "@/lib/seo/config";

interface SeoProps {
  /** Page-specific title. Rendered as "{title} | site name". */
  title: string;
  description: string;
  /** Path relative to the site root, e.g. "/" or "/pricing". Used to build the canonical/OG URL. */
  path: string;
  /** Absolute image URL for social previews. Omit if the page has no image. */
  image?: string;
  type?: "website" | "article";
  /** Set true on pages that should never be indexed (auth screens, app-internal routes). */
  noindex?: boolean;
}

/**
 * Reusable per-page head/meta management (PERPRO-25).
 *
 * Built on React 19's native support for hoisting <title>, <meta>, and
 * <link> tags rendered anywhere in the component tree into <head> -- no
 * react-helmet or other extra dependency required. Render one <Seo> per
 * routed page, anywhere in that page's component tree.
 *
 * Architectural note: this is a client-rendered Vite SPA, so these tags
 * land in the DOM after JS runs, not in the raw HTML a crawler fetches on
 * first request. Google's crawler executes JS and picks this up; many
 * AI-answer-engine crawlers and simpler bots do not. This component is the
 * right default for this template's baseline SEO/AEO pass. An idea that
 * goes all-in on content marketing/SEO for its public pages should reach
 * for a prerendered/SSR setup (e.g. a separate Astro site) instead of
 * trying to stretch this pattern further -- see the PERPRO-25 ticket.
 *
 * Heading-hierarchy convention (PERPRO-25): each *public, indexable*
 * page renders
 * exactly one <h1> (the page's real, visible title -- not the <title>
 * tag this component manages). Auth screens (login/register) are
 * noindex and are not held to this -- only pages meant to be crawled
 * and cited need the full heading structure.
 * Section headings below it nest as <h2>, then <h3>, in document order,
 * never skipping a level. shadcn's <CardTitle> is a styled <div>, not a
 * heading element, so wrap real page/section headings in actual <h1>-<h6>
 * tags yourself; see src/pages/Home.tsx for the reference example.
 */
export function Seo({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
}: SeoProps) {
  const url = `${SITE_URL}${path}`;
  const fullTitle = `${title} | ${SITE_NAME}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow"}
      />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image ? <meta property="og:image" content={image} /> : null}

      <meta
        name="twitter:card"
        content={image ? "summary_large_image" : "summary"}
      />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image ? <meta name="twitter:image" content={image} /> : null}
    </>
  );
}
