import { getTranslations } from "next-intl/server";
import { MARKETING_SECURITY_IDS } from "@/features/marketing/lib/security-ids";

export async function SecuritySection() {
  const t = await getTranslations("marketing.security");

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
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MARKETING_SECURITY_IDS.map((id) => (
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
