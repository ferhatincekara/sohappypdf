export type ProductJsonLdInput = {
  name: string;
  description: string;
  url: string;
  freePlanName: string;
};

export function buildProductJsonLd(
  input: ProductJsonLdInput,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      name: input.freePlanName,
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function productJsonLdContainsReviews(
  data: Record<string, unknown>,
): boolean {
  const serialized = JSON.stringify(data).toLowerCase();

  return (
    serialized.includes("aggregaterating") ||
    serialized.includes('"review"') ||
    serialized.includes('"reviews"')
  );
}
