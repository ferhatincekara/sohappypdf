import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { Link } from "@/lib/i18n/navigation";

export async function HomeCtaBanner({ toolCount }: { toolCount: number }) {
  const t = await getTranslations("marketing.ctaBanner");

  return (
    <section className="px-4 py-8 md:px-6 md:py-12">
      <MarketingContainer className="overflow-hidden rounded-10 bg-primary px-6 py-12 text-center md:px-12 md:py-16">
        <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
          {t("title", { count: toolCount })}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-lg/7 text-foreground/85">
          {t("description")}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
          <Button
            variant="dark"
            size="lg"
            nativeButton={false}
            render={<Link href={MARKETING_PATHS.tools} />}
          >
            {t("toolsCta")}
          </Button>
          <Button
            variant="white"
            size="lg"
            nativeButton={false}
            render={<Link href={MARKETING_PATHS.pricing} />}
          >
            {t("startCta")}
          </Button>
        </div>
      </MarketingContainer>
    </section>
  );
}
