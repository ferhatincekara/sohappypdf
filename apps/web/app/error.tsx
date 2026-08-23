"use client";

import { useTranslations } from "next-intl";

export default function ErrorBoundary() {
  const t = useTranslations("errors");

  return (
    <main>
      <h1>{t("generic")}</h1>
    </main>
  );
}
