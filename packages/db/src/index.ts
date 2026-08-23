import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/db");

export type { CreateDatabaseOptions, Database } from "./client.js";
export { createDatabase, getDb } from "./client.js";
export type { ApiKeyRow, NewApiKeyRow } from "./schema/api-keys.js";
export { apiKeyRelations, apiKeys } from "./schema/api-keys.js";
export type {
  AccountRow,
  NewAccountRow,
  NewSessionRow,
  NewUserRow,
  NewVerificationRow,
  SessionRow,
  UserRow,
  VerificationRow,
} from "./schema/auth.js";
export {
  account,
  accountRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from "./schema/auth.js";
export type { ConversionRow, NewConversionRow } from "./schema/conversions.js";
export { conversionStatusEnum, conversions } from "./schema/conversions.js";
export type { FileRow, NewFileRow } from "./schema/files.js";
export { fileStatusEnum, files } from "./schema/files.js";
export * as schema from "./schema/index.js";
