import { listRegisteredTools } from "@sohappypdf/tools/catalog";
import { getTranslations } from "next-intl/server";
import { MARKETING_FEATURE_IDS } from "@/features/marketing/lib/feature-ids";

export async function FeaturesSection() {
  const t = await getTranslations("marketing.features");
  const tTools = await getTranslations("tools");
  const toolLabels = listRegisteredTools().map((tool) =>
    tTools(`${tool.id}.name`),
  );

  return (
    <section className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-2 text-lg/7 text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {toolLabels.map((label) => (
            <li
              key={label}
              className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium"
            >
              {label}
            </li>
          ))}
        </ul>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MARKETING_FEATURE_IDS.map((id) => (
            <li
              key={id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <h3 className="text-sm font-semibold">
                {t(`items.${id}.title`)}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`items.${id}.description`)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
