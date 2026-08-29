"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { isFileConvertible } from "@/features/conversions/lib/is-file-convertible";
import type { PublicFile } from "@/features/files/types/file";

export function FileConvertButton({
  file,
  onConvert,
}: {
  file: PublicFile;
  onConvert: (file: PublicFile) => void;
}) {
  const t = useTranslations("conversions.actions");

  if (!isFileConvertible(file)) {
    return null;
  }

  return (
    <Button type="button" size="sm" onClick={() => onConvert(file)}>
      {t("convert")}
    </Button>
  );
}
