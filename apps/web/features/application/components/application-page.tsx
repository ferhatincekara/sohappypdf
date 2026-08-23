import { getTranslations } from "next-intl/server";
import { getWebSession } from "@/features/auth/session/get-web-session";

export async function ApplicationPage() {
  const session = await getWebSession();
  const t = await getTranslations("app");

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">{t("authenticated")}</h1>
      {session !== null ? (
        <p className="text-sm text-muted-foreground">
          {t("signedInAs", { email: session.user.email })}
        </p>
      ) : null}
    </div>
  );
}
