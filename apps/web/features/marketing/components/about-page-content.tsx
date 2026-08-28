import { getTranslations } from "next-intl/server";
import { AboutQuestions } from "./about-questions";
import { MarketingContainer } from "./marketing-container";
import { MarketingPageHeader } from "./marketing-page-header";

const BELIEFS = ["pages", "anonymous", "files", "api"] as const;

export async function AboutPageContent() {
  const t = await getTranslations("marketing.about");

  return (
    <section className="pb-16 pt-8 md:pb-24 md:pt-12">
      <MarketingContainer>
        <MarketingPageHeader
          title={t("title")}
          description={t("description")}
        />

        <div className="mt-12 flex flex-col gap-16 md:mt-16 md:gap-20">
          <section aria-labelledby="about-story" className="max-w-2xl">
            <h2
              id="about-story"
              className="text-xl font-bold tracking-tight md:text-2xl"
            >
              {t("story.title")}
            </h2>
            <p className="mt-4 text-lg/7 text-muted-foreground text-pretty">
              {t("story.lead")}
            </p>
            <p className="mt-4 text-lg/7 text-muted-foreground text-pretty">
              {t("story.body")}
            </p>
          </section>

          <section aria-labelledby="about-beliefs">
            <div>
              <h2
                id="about-beliefs"
                className="text-xl font-bold tracking-tight md:text-2xl"
              >
                {t("beliefs.title")}
              </h2>
              <p className="mt-2 max-w-3xl text-lg/7 text-muted-foreground text-pretty">
                {t("beliefs.description")}
              </p>
            </div>
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {BELIEFS.map((id) => (
                <li key={id} className="rounded-3xl bg-muted p-6 md:p-8">
                  <h3 className="text-base font-bold tracking-tight md:text-lg">
                    {t(`beliefs.items.${id}.title`)}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                    {t(`beliefs.items.${id}.text`)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="about-questions">
            <div>
              <h2
                id="about-questions"
                className="text-xl font-bold tracking-tight md:text-2xl"
              >
                {t("questions.title")}
              </h2>
              <p className="mt-2 max-w-3xl text-lg/7 text-muted-foreground text-pretty">
                {t("questions.description")}
              </p>
            </div>
            <AboutQuestions />
          </section>
        </div>
      </MarketingContainer>
    </section>
  );
}
