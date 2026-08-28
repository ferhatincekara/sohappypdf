"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const ABOUT_QUESTION_IDS = ["what", "who", "why", "start"] as const;

export function AboutQuestions() {
  const t = useTranslations("marketing.about.questions");

  return (
    <Accordion defaultValue="what" className="mt-8 w-full md:mt-10">
      {ABOUT_QUESTION_IDS.map((id) => (
        <AccordionItem key={id} value={id} className="border-border">
          <AccordionTrigger className="text-base font-bold tracking-tight md:text-lg">
            {t(`items.${id}.q`)}
          </AccordionTrigger>
          <AccordionPanel className="text-base leading-relaxed">
            {t(`items.${id}.a`)}
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
