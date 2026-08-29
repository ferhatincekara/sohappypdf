"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";

const FAQ_IDS = [
  "anonymous",
  "files",
  "privacy",
  "formats",
  "limits",
  "account",
  "credits",
  "pro",
  "payment",
  "api",
] as const;

export function FaqSection({ asPage = false }: { asPage?: boolean }) {
  const t = useTranslations("marketing.faq");

  return (
    <section
      className={asPage ? "pb-16 pt-8 md:pb-24 md:pt-12" : "py-16 md:py-24"}
    >
      <MarketingContainer>
        <MarketingPageHeader
          title={t("title")}
          description={t("description")}
          titleAs={asPage ? "h1" : "h2"}
        />
        <Accordion defaultValue="anonymous" className="mt-10 w-full md:mt-12">
          {FAQ_IDS.map((id) => (
            <AccordionItem key={id} value={id} className="border-border">
              <AccordionTrigger className="text-base font-bold tracking-tight md:text-lg">
                {t(`items.${id}.q`)}
              </AccordionTrigger>
              <AccordionPanel className="text-base">
                {t(`items.${id}.a`)}
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </MarketingContainer>
    </section>
  );
}
