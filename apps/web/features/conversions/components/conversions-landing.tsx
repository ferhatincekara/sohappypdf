import { getTranslations } from "next-intl/server";
import { APP_PATHS } from "@/features/app-shell";
import { Link } from "@/lib/i18n/navigation";

export async function ConversionsLanding() {
  const t = await getTranslations("conversions.landing");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <Link
        href={APP_PATHS.files}
        className="w-fit text-sm font-medium text-foreground underline-offset-4 hover:underline"
      >
        {t("openFiles")}
      </Link>
    </div>
  );
}
