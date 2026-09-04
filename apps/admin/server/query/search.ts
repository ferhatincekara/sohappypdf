import { anonymousSessions, conversions, getDb, user } from "@sohappypdf/db";
import { listCatalogTools } from "@sohappypdf/tools";
import { desc, ilike, or, sql } from "drizzle-orm";
import { matchesCatalogTool } from "@/server/query/search-match";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AdminSearchResult = {
  kind: "user" | "execution" | "anonymous-session" | "tool";
  id: string;
  label: string;
  href: string;
};

export async function searchAdmin(query: string): Promise<AdminSearchResult[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2 || trimmed.length > 120) {
    return [];
  }

  const db = getDb();
  const like = `%${trimmed}%`;
  const results: AdminSearchResult[] = [];
  const needle = trimmed.toLowerCase();

  for (const tool of listCatalogTools()) {
    if (matchesCatalogTool(tool, needle)) {
      results.push({
        kind: "tool",
        id: tool.id,
        label: tool.id,
        href: `/tools/${tool.id}`,
      });
    }

    if (results.length >= 5) {
      break;
    }
  }

  if (UUID_PATTERN.test(trimmed)) {
    const [execution] = await db
      .select({
        id: conversions.id,
        conversionType: conversions.conversionType,
      })
      .from(conversions)
      .where(sql`${conversions.id} = ${trimmed}`)
      .limit(1);

    if (execution !== undefined) {
      results.push({
        kind: "execution",
        id: execution.id,
        label: execution.conversionType,
        href: `/executions/${execution.id}`,
      });
    }

    const [anonymous] = await db
      .select({ id: anonymousSessions.id })
      .from(anonymousSessions)
      .where(sql`${anonymousSessions.id} = ${trimmed}`)
      .limit(1);

    if (anonymous !== undefined) {
      results.push({
        kind: "anonymous-session",
        id: anonymous.id,
        label: "Anonymous session",
        href: `/anonymous-sessions/${anonymous.id}`,
      });
    }
  } else {
    const executions = await db
      .select({
        id: conversions.id,
        conversionType: conversions.conversionType,
      })
      .from(conversions)
      .where(ilike(conversions.conversionType, like))
      .orderBy(desc(conversions.createdAt))
      .limit(5);

    for (const execution of executions) {
      results.push({
        kind: "execution",
        id: execution.id,
        label: execution.conversionType,
        href: `/executions/${execution.id}`,
      });
    }
  }

  const users = await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
    .where(
      or(
        sql`${user.id} = ${trimmed}`,
        ilike(user.email, like),
        ilike(user.name, like),
      ),
    )
    .limit(5);

  for (const row of users) {
    results.push({
      kind: "user",
      id: row.id,
      label: row.email,
      href: `/users/${row.id}`,
    });
  }

  return results.slice(0, 12);
}
