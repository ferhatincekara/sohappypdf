export type PublicToolFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export function buildPublicToolFaqJsonLd(input: {
  items: readonly PublicToolFaqItem[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: input.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildPublicToolWebPageJsonLd(input: {
  name: string;
  description: string;
  url: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: input.url,
  };
}
