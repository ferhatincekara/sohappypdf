import { getTranslations } from "next-intl/server";
import { getPublicApiV1BaseUrl } from "@/config/public-env";
import { ApiKeysWorkspace } from "@/features/api-keys/components/api-keys-workspace";
import { AccountPageHeader } from "@/features/app-shell";
import { DEVELOPER_PATHS } from "@/features/developer-docs";

export async function ApiKeysPageContent() {
  const t = await getTranslations("apiKeys");

  return (
    <div className="flex flex-col gap-8">
      <AccountPageHeader title={t("title")} description={t("description")} />
      <ApiKeysWorkspace
        apiV1BaseUrl={getPublicApiV1BaseUrl()}
        docsHref={DEVELOPER_PATHS.docs}
      />
    </div>
  );
}
