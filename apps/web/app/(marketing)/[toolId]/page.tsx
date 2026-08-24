import {
  findRegisteredTool,
  listRegisteredTools,
  type ToolId,
} from "@repo/tools/catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPublicWebEnv } from "@/config/public-env";
import { getWebSession } from "@/features/auth/session/get-web-session";
import { hasWebSession } from "@/features/auth/session/session-state";
import { getRelatedMarketingTools } from "@/features/marketing/lib/marketing-tools";
import { PublicToolPageContent } from "@/features/public-tools";

export function generateStaticParams() {
  return listRegisteredTools().map((tool) => ({ toolId: tool.id }));
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

  const t = await getTranslations("publicTools");
  const tTools = await getTranslations("tools");

  return {
    title: t("metaTitle", { tool: tTools(`${tool.id}.name`) }),
    description: tTools(`${tool.id}.description`),
  };
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
      maxAuthenticatedFileSizeBytes={getPublicWebEnv().maxUploadFileSizeBytes}
    />
  );
}

export type PublicToolPageParams = {
  toolId: ToolId;
};
