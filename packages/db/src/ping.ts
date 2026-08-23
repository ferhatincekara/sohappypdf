import { sql } from "drizzle-orm";
import type { Database } from "./client.js";
import { getDb } from "./client.js";

export async function pingDatabase(db: Database = getDb()): Promise<void> {
  await db.execute(sql`select 1`);
}
