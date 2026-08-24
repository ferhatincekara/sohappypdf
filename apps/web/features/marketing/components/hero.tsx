import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { MARKETING_PATHS } from "../lib/marketing-paths";
import { ProductDemo } from "./product-demo";

export async function Hero({ startHref }: { startHref: string }) {
  const t = await getTranslations("marketing.hero");

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
      <div className="flex flex-col gap-6">
        <p className="text-sm font-medium text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
          {t("title")}
        </h1>
        <p className="max-w-xl text-base text-muted-foreground text-pretty">
          {t("description")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={startHref} className={buttonVariants({ size: "lg" })}>
            {t("primaryCta")}
          </Link>
          <Link
            href={MARKETING_PATHS.developers}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {t("secondaryCta")}
          </Link>
        </div>
      </div>
      <ProductDemo compact />
    </section>
  );
}
