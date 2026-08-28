import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { getMarketingApiExample } from "../lib/marketing-api-example";
import { MARKETING_PATHS } from "../lib/marketing-paths";

export async function DeveloperSection() {
  const t = await getTranslations("marketing.developer");
  const example = getMarketingApiExample();

  return (
    <section className="border-t border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h2>
          <p className="text-muted-foreground">{t("description")}</p>
          <p className="text-sm text-muted-foreground">{t("authHint")}</p>
          <Button
            variant="outline"
            className="w-fit"
            nativeButton={false}
            render={<Link href={MARKETING_PATHS.developers} />}
          >
            {t("cta")}
          </Button>
        </div>
        <figure className="min-w-0">
          <figcaption className="mb-2 text-sm font-medium">
            {t("exampleLabel")}
          </figcaption>
          <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 font-mono text-xs leading-6">
            <code>{example}</code>
          </pre>
        </figure>
      </div>
    </section>
  );
}
