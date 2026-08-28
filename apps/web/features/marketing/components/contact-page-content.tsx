import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import {
  MARKETING_SUPPORT_EMAIL,
  MARKETING_SUPPORT_MAILTO,
} from "../lib/marketing-contact";
import { MARKETING_PATHS } from "../lib/marketing-paths";
import { MarketingContainer } from "./marketing-container";
import { MarketingPageHeader } from "./marketing-page-header";

const TOPICS = ["product", "billing", "api"] as const;

export async function ContactPageContent() {
  const t = await getTranslations("marketing.contact");

  return (
    <section className="pb-16 pt-8 md:pb-24 md:pt-12">
      <MarketingContainer>
        <MarketingPageHeader
          title={t("title")}
          description={t("description")}
        />

        <div className="mt-12 max-w-2xl rounded-7 bg-muted px-6 py-8 md:mt-16 md:px-10 md:py-10">
          <p className="text-sm font-bold">{t("emailLabel")}</p>
          <a
            href={MARKETING_SUPPORT_MAILTO}
            className="mt-2 block text-2xl font-extrabold tracking-tight break-all md:text-3xl"
          >
            {MARKETING_SUPPORT_EMAIL}
          </a>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
            {t("emailHint")}
          </p>
          <Button
            className="mt-6"
            nativeButton={false}
            render={<a href={MARKETING_SUPPORT_MAILTO} />}
          >
            {t("emailCta")}
          </Button>
        </div>

        <section aria-labelledby="contact-topics" className="mt-16 md:mt-20">
          <div className="max-w-2xl">
            <h2
              id="contact-topics"
              className="text-xl font-bold tracking-tight md:text-2xl"
            >
              {t("topics.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">
              {t("topics.description")}
            </p>
          </div>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {TOPICS.map((id) => (
              <li key={id} className="rounded-3xl bg-muted p-6 md:p-8">
                <h3 className="text-base font-bold tracking-tight md:text-lg">
                  {t(`topics.items.${id}.title`)}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {t(`topics.items.${id}.text`)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-16 rounded-7 bg-muted px-6 py-8 md:mt-20 md:px-10 md:py-10">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">
            {t("faq.title")}
          </h2>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-muted-foreground">
            {t("faq.description")}
          </p>
          <Button
            className="mt-6"
            variant="white"
            nativeButton={false}
            render={<Link href={MARKETING_PATHS.faq} />}
          >
            {t("faq.cta")}
          </Button>
        </div>
      </MarketingContainer>
    </section>
  );
}
