"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { APP_PATHS } from "@/features/app-shell";
import {
  CHECKOUT_ACTIVATION_WAIT_MS,
  type CheckoutReturnPhase,
} from "@/features/billing/lib/checkout-activation";
import { useRouter } from "@/lib/i18n/navigation";

export function useCheckoutReturn(): {
  phase: CheckoutReturnPhase;
  dismiss: () => void;
} {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromQuery = searchParams.get("checkout") === "success";
  const [phase, setPhase] = useState<CheckoutReturnPhase>(() =>
    fromQuery ? "confirming" : "idle",
  );

  useEffect(() => {
    if (!fromQuery) {
      return;
    }

    setPhase("confirming");
    router.replace(APP_PATHS.billing, { scroll: false });
  }, [fromQuery, router]);

  useEffect(() => {
    if (phase !== "confirming") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPhase("unconfirmed");
    }, CHECKOUT_ACTIVATION_WAIT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [phase]);

  return {
    phase,
    dismiss() {
      setPhase("idle");
    },
  };
}
