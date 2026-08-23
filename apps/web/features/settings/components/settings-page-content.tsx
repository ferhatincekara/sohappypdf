import { getTranslations } from "next-intl/server";
import { APP_PATHS } from "@/features/app-shell";
import { Link } from "@/lib/i18n/navigation";

export async function SettingsPageContent() {
  const t = await getTranslations("settings");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <section className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-foreground">
          {t("billing.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("billing.description")}
        </p>
        <Link
          href={APP_PATHS.billing}
          className="text-sm font-medium underline underline-offset-4"
        >
          {t("billing.open")}
        </Link>
      </section>
    </div>
  );
}
