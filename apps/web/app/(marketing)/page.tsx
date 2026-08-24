import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getWebSession } from "@/features/auth/session/get-web-session";
import { hasWebSession } from "@/features/auth/session/session-state";
import { MarketingHomePage } from "@/features/marketing/components/marketing-home-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.metadata");

  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    openGraph: {
      title: t("homeTitle"),
      description: t("homeDescription"),
      type: "website",
    },
    twitter: {
      card: "summary",
      title: t("homeTitle"),
      description: t("homeDescription"),
    },
  };
}

export default async function HomeRoute() {
  const session = await getWebSession();

  return <MarketingHomePage isAuthenticated={hasWebSession(session)} />;
}
