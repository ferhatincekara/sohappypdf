import { conversions, getDb } from "@sohappypdf/db";
import { findCatalogTool, listCatalogTools } from "@sohappypdf/tools";
import { desc, eq } from "drizzle-orm";
import { getExecutionToolStats } from "@/server/query/executions";
import { countInt } from "@/server/query/sql";

export function listAdminTools() {
  return listCatalogTools().map((tool) => ({
    id: tool.id,
    nameKey: tool.nameKey,
    category: tool.category,
    route: tool.route,
    availability: tool.availability,
    allowsAnonymous: tool.allowsAnonymous,
    requiresAuthentication: tool.requiresAuthentication,
    availableOnPlans: tool.availableOnPlans,
    processorId: tool.processorId,
    webCreditCost: tool.webCreditCost,
    apiCreditCost: tool.apiCreditCost,
    webAccess: tool.availability !== "planned",
    apiAccess: tool.availability !== "planned",
  }));
}

export async function getAdminToolDetail(toolId: string) {
  const tool = findCatalogTool(toolId);

  if (tool === undefined) {
    return null;
  }

  const db = getDb();
  const stats = await getExecutionToolStats(tool.id);
  const recentFailures = await db
    .select({
      id: conversions.id,
      status: conversions.status,
      errorCode: conversions.errorCode,
      createdAt: conversions.createdAt,
    })
    .from(conversions)
    .where(eq(conversions.conversionType, tool.id))
    .orderBy(desc(conversions.createdAt))
    .limit(8);

  return {
    tool,
    stats: {
      ...stats,
      successRate:
        stats.total === 0 ? null : (stats.completed / stats.total) * 100,
      failureRate:
        stats.total === 0 ? null : (stats.failed / stats.total) * 100,
    },
    recentFailures: recentFailures.filter((row) => row.status === "failed"),
    unusedCount: countInt(undefined),
  };
}
