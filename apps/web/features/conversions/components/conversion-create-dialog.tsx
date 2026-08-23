"use client";

import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PublicFile } from "@/features/files/types/file";
import { useRouter } from "@/lib/i18n/navigation";
import { conversionPath } from "../paths";
import { ConversionForm } from "./conversion-form";

export function ConversionCreateDialog({
  file,
  onClose,
}: {
  file: PublicFile | null;
  onClose: () => void;
}) {
  const t = useTranslations("conversions.form");
  const router = useRouter();

  return (
    <Sheet
      open={file !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent
        side="bottom"
        closeLabel={t("close")}
        className="max-h-[90dvh] w-full gap-0 rounded-t-xl border-t sm:mx-auto sm:max-w-lg"
      >
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-6 pb-8 pt-2">
          {file === null ? null : (
            <ConversionForm
              file={file}
              onCreated={(conversionId) => {
                onClose();
                router.push(conversionPath(conversionId));
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
