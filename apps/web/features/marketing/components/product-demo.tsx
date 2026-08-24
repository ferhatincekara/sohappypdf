import { getTranslations } from "next-intl/server";

const DEMO_STEPS = ["upload", "choose", "convert", "download"] as const;

export async function ProductDemo({ compact = false }: { compact?: boolean }) {
  const t = await getTranslations("marketing.demo");

  return (
    <div
      aria-hidden={compact ? true : undefined}
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-medium">{t("panelTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("status")}</p>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div className="rounded-md border border-border bg-background px-3 py-2">
          <p className="text-xs text-muted-foreground">{t("fileLabel")}</p>
          <p className="text-sm font-medium">{t("fileName")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-background px-3 py-2">
            <p className="text-xs text-muted-foreground">
              {t("conversionLabel")}
            </p>
            <p className="text-sm font-medium">{t("conversion")}</p>
          </div>
          <div className="rounded-md border border-border bg-background px-3 py-2">
            <p className="text-xs text-muted-foreground">{t("resultLabel")}</p>
            <p className="text-sm font-medium">{t("result")}</p>
          </div>
        </div>
        <ol className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {DEMO_STEPS.map((step, index) => (
            <li
              key={step}
              className="rounded-md border border-border bg-secondary px-2 py-2 text-center"
            >
              <span className="block font-medium text-foreground">
                {index + 1}. {t(step)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
