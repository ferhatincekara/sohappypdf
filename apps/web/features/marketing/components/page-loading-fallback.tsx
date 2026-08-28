import { BrandLogo } from "@/components/brand-logo";
import { Skeleton } from "@/components/ui/skeleton";

export function MarketingHeaderSkeleton() {
  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto grid h-16 max-w-site grid-cols-[1fr_auto_1fr] items-center px-5 md:h-20 md:px-8">
        <BrandLogo />
        <div className="col-start-2 hidden items-center justify-self-center gap-2 lg:flex">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
        <div className="col-start-3 flex items-center justify-end justify-self-end">
          <Skeleton className="hidden h-11 w-28 rounded-full md:block" />
          <Skeleton className="size-10 rounded-full lg:hidden" />
        </div>
      </div>
    </div>
  );
}

export function PageContentSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-site flex-1 flex-col gap-6 px-5 py-10 md:px-8 md:py-14">
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="h-12 w-3/4 max-w-lg rounded-2xl" />
      <Skeleton className="h-4 w-full max-w-md rounded-full" />
      <Skeleton className="mt-4 h-56 w-full rounded-7 md:h-72" />
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-7" />
        <Skeleton className="h-28 rounded-7" />
        <Skeleton className="h-28 rounded-7" />
      </div>
    </div>
  );
}

export function MarketingFooterSkeleton() {
  return (
    <div className="bg-muted py-12 md:py-16">
      <div className="mx-auto flex w-full max-w-site flex-col gap-6 px-5 md:px-8">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-16 w-full max-w-sm" />
        <Skeleton className="mt-6 h-px w-full" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}
