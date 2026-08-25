import { resolveWebMaxFileSizeBytes } from "@repo/billing/plans";
import { findRegisteredTool, type ToolId } from "@repo/tools/catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getPublicWebEnv } from "@/config/public-env";
import { getWebSession } from "@/features/auth/session/get-web-session";
import { hasWebSession } from "@/features/auth/session/session-state";
import { getRelatedMarketingTools } from "@/features/marketing/lib/marketing-tools";
import { PublicToolPageContent } from "@/features/public-tools";
import { buildPublicToolMetadata } from "@/features/public-tools/lib/public-tool-metadata";
import { listPublicToolRouteParams } from "@/features/public-tools/lib/public-tool-routes";

export function generateStaticParams() {
  return [...listPublicToolRouteParams()];
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ toolId: string }>;
}): Promise<Metadata> {
  const { toolId } = await params;
  const tool = findRegisteredTool(toolId);

  if (tool === undefined) {
    return {};
  }

  const tTools = await getTranslations("tools");
  const locale = await getLocale();
  const env = getPublicWebEnv();

  return buildPublicToolMetadata({
    name: tTools(`${tool.id}.name`),
    description: tTools(`${tool.id}.description`),
    path: tool.route,
    appUrl: env.appUrl,
    locale,
  });
}

export default async function PublicToolPage({
  params,
}: {
  params: Promise<{ toolId: string }>;
}) {
  const { toolId } = await params;
  const tool = findRegisteredTool(toolId);

  if (tool === undefined) {
    notFound();
  }

  const session = await getWebSession();
  const isAuthenticated = hasWebSession(session);

  return (
    <PublicToolPageContent
      tool={tool}
      isAuthenticated={isAuthenticated}
      relatedTools={getRelatedMarketingTools(tool)}
      maxAuthenticatedFileSizeBytes={resolveWebMaxFileSizeBytes({
        isAuthenticated: true,
      })}
    />
  );
}

export type PublicToolPageParams = {
  toolId: ToolId;
};
