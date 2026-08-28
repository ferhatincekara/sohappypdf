import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";

export default async function AccountLoading() {
  const t = await getTranslations("errors");

  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <p className="sr-only">{t("loading")}</p>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-16 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-48 rounded-2xl" />
        <Skeleton className="h-5 w-full max-w-md rounded-full" />
      </div>
      <Skeleton className="h-40 w-full rounded-7" />
    </div>
  );
}
