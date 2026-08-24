"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { APP_PATHS } from "@/features/app-shell";
import { useRouter } from "@/lib/i18n/navigation";

export function useCheckoutReturn(): boolean {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromQuery = searchParams.get("checkout") === "success";
  const [checkoutReturn, setCheckoutReturn] = useState(fromQuery);

  useEffect(() => {
    if (!fromQuery) {
      return;
    }

    setCheckoutReturn(true);
    router.replace(APP_PATHS.billing, { scroll: false });
  }, [fromQuery, router]);

  return checkoutReturn;
}
