import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FilesWorkspace } from "./files-workspace";

export async function FilesPageContent() {
  const t = await getTranslations("files");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-lg/7 text-muted-foreground">{t("description")}</p>
      </div>
      <Suspense
        fallback={
          <div className="flex flex-col gap-3" aria-busy="true">
            <p className="sr-only">{t("list.loading")}</p>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        }
      >
        <FilesWorkspace />
      </Suspense>
    </div>
  );
}
