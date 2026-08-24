import { getPublicWebEnv } from "@/config/public-env";
import { buildProductJsonLd } from "../lib/product-json-ld";

export function ProductJsonLd({
  name,
  description,
  freePlanName,
}: {
  name: string;
  description: string;
  freePlanName: string;
}) {
  const jsonLd = buildProductJsonLd({
    name,
    description,
    url: getPublicWebEnv().appUrl,
    freePlanName,
  });

  const serialized = JSON.stringify(jsonLd).replaceAll("<", "\\u003c");

  return (
    <script
      type="application/ld+json"
      // Controlled product facts only. No user input, reviews, or ratings.
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires a script tag with serialized structured data.
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}
