import { getTranslations } from "next-intl/server";
import { getPublicApiV1BaseUrl } from "@/config/public-env";
import { DEVELOPER_PATHS } from "@/features/developer-docs";
import { ApiKeysWorkspace } from "./api-keys-workspace";

export async function ApiKeysPageContent() {
  const t = await getTranslations("apiKeys");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <ApiKeysWorkspace
        apiV1BaseUrl={getPublicApiV1BaseUrl()}
        docsHref={DEVELOPER_PATHS.docs}
      />
    </div>
  );
}
