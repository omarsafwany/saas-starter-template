import { SITE_NAME, SITE_URL } from "@/lib/seo/config";

/**
 * Generic schema.org JSON-LD emitter (PERPRO-25).
 *
 * Renders a plain inline <script type="application/ld+json">. This is
 * intentionally NOT built with dangerouslySetInnerHTML: React inserts the
 * JSON.stringify output as a literal text node via the DOM API, so it never
 * goes through HTML parsing/escaping, which is both simpler and avoids the
 * usual "</script> inside a string" injection footgun that
 * dangerouslySetInnerHTML-based JSON-LD helpers have to guard against.
 *
 * JSON-LD does not need to live in <head> -- Google and schema.org both
 * treat a <script type="application/ld+json"> anywhere in the document as
 * valid, so this renders in place wherever the page puts it.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * FAQPage structured data. Pair this with a *visible* FAQ section using the
 * same copy -- structured data should describe content that is actually on
 * the page, not content that only exists in the JSON-LD.
 */
export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }}
    />
  );
}

/** Site-wide Organization structured data. Render once, e.g. on the home page. */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      }}
    />
  );
}
