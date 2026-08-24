import { getTranslations } from "next-intl/server";
import { HOW_IT_WORKS_STEP_IDS } from "../lib/how-it-works-ids";

export async function HowItWorks() {
  const t = await getTranslations("marketing.howItWorks");

  return (
    <section className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">{t("title")}</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {HOW_IT_WORKS_STEP_IDS.map((id, index) => (
            <li
              key={id}
              className="rounded-lg border border-border bg-card p-5"
            >
              <p className="text-xs font-medium text-muted-foreground">
                {t("step", { number: index + 1 })}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{t(`${id}.title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`${id}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
