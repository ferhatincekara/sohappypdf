import { getLocale, getTranslations } from "next-intl/server";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";
import { MARKETING_SUPPORT_EMAIL } from "@/features/marketing/lib/marketing-contact";
import { Link } from "@/lib/i18n/navigation";
import {
  LEGAL_PAGE_IDS,
  LEGAL_PAGE_SECTIONS,
  LEGAL_PATHS,
  LEGAL_UPDATED_AT,
  type LegalPageId,
} from "../lib/legal-paths";

export async function LegalDocumentPage({ pageId }: { pageId: LegalPageId }) {
  const t = await getTranslations("legal");
  const locale = await getLocale();
  const sections = LEGAL_PAGE_SECTIONS[pageId];
  const updated = formatLegalDate(LEGAL_UPDATED_AT, locale);

  return (
    <article className="pb-16 pt-8 md:pb-24 md:pt-12">
      <MarketingContainer className="max-w-3xl">
        <MarketingPageHeader
          eyebrow={t("eyebrow")}
          title={t(`${pageId}.title`)}
          description={t(`${pageId}.description`)}
        />
        <p className="mt-4 text-sm text-muted-foreground">
          {t("updated", { date: updated })}
        </p>

        <div className="mt-12 flex flex-col gap-10">
          {sections.map((sectionId) => (
            <section key={sectionId} aria-labelledby={`${pageId}-${sectionId}`}>
              <h2
                id={`${pageId}-${sectionId}`}
                className="text-xl font-bold tracking-tight md:text-2xl"
              >
                {t(`${pageId}.sections.${sectionId}.title`)}
              </h2>
              <p className="mt-3 text-lg/7 text-muted-foreground text-pretty">
                {t(`${pageId}.sections.${sectionId}.body`)}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-12 text-sm leading-relaxed text-muted-foreground">
          {t("contactHint")}{" "}
          <a
            href={`mailto:${MARKETING_SUPPORT_EMAIL}`}
            className="font-semibold text-foreground underline underline-offset-4"
          >
            {MARKETING_SUPPORT_EMAIL}
          </a>
        </p>

        <nav
          aria-label={t("eyebrow")}
          className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-6 text-sm font-semibold"
        >
          {LEGAL_PAGE_IDS.filter((id) => id !== pageId).map((id) => (
            <Link
              key={id}
              href={LEGAL_PATHS[id]}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {t(`${id}.nav`)}
            </Link>
          ))}
        </nav>
      </MarketingContainer>
    </article>
  );
}

function formatLegalDate(date: string, locale: string): string {
  const [year, month, day] = date.split("-").map(Number);

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    throw new Error(`Invalid legal date: ${date}`);
  }

  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
