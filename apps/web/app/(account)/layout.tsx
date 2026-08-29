import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { requireWebSession } from "@/features/auth/session/require-web-session";
import { TITLE_TEMPLATE } from "@/features/seo/lib/site-brand";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("appShell");

  return {
    title: {
      default: t("navigation"),
      template: TITLE_TEMPLATE,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AccountGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireWebSession();

  return children;
}
