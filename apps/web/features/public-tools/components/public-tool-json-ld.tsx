import {
  buildPublicToolFaqJsonLd,
  buildPublicToolWebPageJsonLd,
  type PublicToolFaqItem,
} from "../lib/public-tool-json-ld";

function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}

export function PublicToolJsonLd({
  name,
  description,
  url,
  faq,
}: {
  name: string;
  description: string;
  url: string;
  faq: readonly PublicToolFaqItem[];
}) {
  const page = serializeJsonLd(
    buildPublicToolWebPageJsonLd({ name, description, url }),
  );
  const faqPage = serializeJsonLd(buildPublicToolFaqJsonLd({ items: faq }));

  return (
    <>
      <script
        type="application/ld+json"
        // Controlled catalog copy only.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires a script tag with serialized structured data.
        dangerouslySetInnerHTML={{ __html: page }}
      />
      <script
        type="application/ld+json"
        // Controlled FAQ copy derived from tool limits.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires a script tag with serialized structured data.
        dangerouslySetInnerHTML={{ __html: faqPage }}
      />
    </>
  );
}
