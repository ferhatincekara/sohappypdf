import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

export async function HomePage() {
  const t = await getTranslations("home");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("tagline")}</p>
      <Link className={buttonVariants()} href="/app">
        {t("openApp")}
      </Link>
    </div>
  );
}
