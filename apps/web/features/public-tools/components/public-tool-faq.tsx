import type { PublicToolFaqItem } from "../lib/public-tool-json-ld";

export function PublicToolFaq({
  title,
  items,
}: {
  title: string;
  items: readonly PublicToolFaqItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="tool-faq-heading" className="flex flex-col gap-3">
      <h2
        id="tool-faq-heading"
        className="text-lg font-semibold tracking-tight"
      >
        {title}
      </h2>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <details
            key={item.id}
            className="rounded-lg border border-border bg-card px-4 py-3"
          >
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              {item.question}
            </summary>
            <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
