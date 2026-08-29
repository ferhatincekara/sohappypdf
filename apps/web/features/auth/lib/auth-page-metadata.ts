import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPublicWebEnv } from "@/config/public-env";

type AuthMetadataPage =
  | "login"
  | "register"
  | "forgotPassword"
  | "resetPassword";

export async function buildAuthPageMetadata(input: {
  page: AuthMetadataPage;
  path: string;
  canonicalPath?: string;
  index?: boolean;
  follow?: boolean;
}): Promise<Metadata> {
  const t = await getTranslations(`auth.${input.page}`);
  const appUrl = getPublicWebEnv().appUrl;
  const canonicalPath = input.canonicalPath ?? input.path;
  const shouldIndex = input.index ?? true;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${appUrl}${canonicalPath}`,
    },
    robots: shouldIndex
      ? undefined
      : {
          index: false,
          follow: input.follow ?? false,
        },
  };
}
