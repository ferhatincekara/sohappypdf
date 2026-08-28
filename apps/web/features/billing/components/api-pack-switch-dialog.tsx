"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatUsdAmount } from "../lib/billing-view";

export function ApiPackSwitchDialog({
  open,
  packName,
  monthlyPrice,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  packName: string;
  monthlyPrice: number;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("billing");

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) {
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent closeLabel={t("api.switchClose")}>
        <DialogHeader>
          <DialogTitle>
            {t("api.switchTo", {
              pack: packName,
            })}
          </DialogTitle>
          <DialogDescription>
            {t("api.switchConfirmBody", {
              pack: packName,
              price: formatUsdAmount(monthlyPrice),
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              onOpenChange(false);
            }}
          >
            {t("api.switchCancel")}
          </Button>
          <Button
            type="button"
            disabled={isPending}
            aria-busy={isPending}
            onClick={onConfirm}
          >
            {t("api.switchConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
