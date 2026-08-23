import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { APP_PATHS } from "../config/app-paths";

export async function SidebarHeader() {
  const t = await getTranslations("appShell");

  return (
    <div className="flex h-14 items-center px-4">
      <Link
        href={APP_PATHS.overview}
        className="text-sm font-semibold tracking-tight text-foreground"
      >
        {t("brand")}
      </Link>
    </div>
  );
}
