"use client";

import { useSearchParams } from "next/navigation";

export function useCheckoutReturn(): boolean {
  const searchParams = useSearchParams();
  return searchParams.get("checkout") === "success";
}
