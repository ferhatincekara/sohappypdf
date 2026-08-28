import { getTranslations } from "next-intl/server";
import { BrandLogo, BrandStarMark } from "@/components/brand-logo";
import { Skeleton } from "@/components/ui/skeleton";

export default async function AuthLoading() {
  const t = await getTranslations("errors");
  const tShell = await getTranslations("auth.shell");

  return (
    <div className="grid min-h-svh lg:grid-cols-2" aria-busy="true">
      <p className="sr-only" aria-live="polite">
        {t("loading")}
      </p>
      <div className="relative hidden overflow-hidden bg-secondary lg:block">
        <BrandStarMark className="absolute -right-8 -top-10 size-80 rotate-12 text-primary" />
      </div>
      <div className="flex flex-col bg-white px-5 py-8 sm:px-10 lg:px-16 lg:py-10">
        <BrandLogo title={tShell("brand")} className="lg:hidden" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 py-10">
          <Skeleton className="h-10 w-48 rounded-2xl" />
          <Skeleton className="h-4 w-full max-w-xs rounded-full" />
          <Skeleton className="mt-4 h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="mt-2 h-11 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
