import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/db");

export type { CreateDatabaseOptions, Database } from "./client.js";
export { createDatabase, getDb } from "./client.js";
export type { FileRow, NewFileRow } from "./schema/files.js";
export { fileStatusEnum, files } from "./schema/files.js";
export * as schema from "./schema/index.js";
