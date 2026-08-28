import { getTranslations } from "next-intl/server";
import { AccountPageHeader } from "@/features/app-shell";
import { BillingWorkspace } from "./billing-workspace";

export async function BillingPageContent() {
  const t = await getTranslations("billing");

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <AccountPageHeader title={t("title")} description={t("description")} />
      <BillingWorkspace />
    </div>
  );
}
