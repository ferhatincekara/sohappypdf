import { getTranslations } from "next-intl/server";
import { ProductDemo } from "@/features/marketing/components/product-demo";

export async function ProductDemoSection() {
  const t = await getTranslations("marketing.demo");

  return (
    <section id="product" className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-2 text-lg/7 text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <ProductDemo />
      </div>
    </section>
  );
}
