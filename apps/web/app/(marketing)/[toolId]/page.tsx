import {
  findRegisteredTool,
  listRegisteredTools,
  type ToolId,
} from "@repo/tools/catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
  const tTypes = await getTranslations("conversions.form.types");

  return {
    title: t("metaTitle", { tool: tTypes(tool.id) }),
    description: t("description"),
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

  return <PublicToolPageContent tool={tool} />;
}

export type PublicToolPageParams = {
  toolId: ToolId;
};
