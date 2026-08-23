import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/db");

export type { CreateDatabaseOptions, Database } from "./client.js";
export { createDatabase, getDb } from "./client.js";
export * as schema from "./schema/index.js";
