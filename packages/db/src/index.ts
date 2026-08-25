import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/db");

export type { CreateDatabaseOptions, Database } from "./client.js";
export { createDatabase, getDb } from "./client.js";
export { pingDatabase } from "./ping.js";
export type {
  AdminAuditEventRow,
  NewAdminAuditEventRow,
} from "./schema/admin-audit-events.js";
export { adminAuditEvents } from "./schema/admin-audit-events.js";
export type {
  AnonymousSessionRow,
  NewAnonymousSessionRow,
} from "./schema/anonymous-sessions.js";
export { anonymousSessions } from "./schema/anonymous-sessions.js";
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
export type {
  ApiSubscriptionRow,
  BillingCustomerRow,
  BillingSubscriptionRow,
  ConversionUsageEventRow,
  NewApiSubscriptionRow,
  NewBillingCustomerRow,
  NewBillingSubscriptionRow,
  NewUsagePeriodRow,
  NewWebCreditLedgerEntryRow,
  NewWebhookEventRow,
  UsagePeriodRow,
  WebCreditLedgerEntryRow,
  WebhookEventRow,
} from "./schema/billing.js";
export {
  apiProductKeyEnum,
  apiSubscriptions,
  billingCustomers,
  billingPlanEnum,
  billingSubscriptionStatusEnum,
  billingSubscriptions,
  conversionUsageEvents,
  creditLedgerSourceEnum,
  creditLedgerTypeEnum,
  usagePeriods,
  webCreditLedgerEntries,
  webhookEvents,
} from "./schema/billing.js";
export type { ConversionRow, NewConversionRow } from "./schema/conversions.js";
export { conversionStatusEnum, conversions } from "./schema/conversions.js";
export type { FileRow, NewFileRow } from "./schema/files.js";
export { fileStatusEnum, files } from "./schema/files.js";
export * as schema from "./schema/index.js";
export type { ResourceOwnerKind } from "./schema/resource-owner.js";
export {
  RESOURCE_OWNER_KINDS,
  resourceOwnerKindEnum,
} from "./schema/resource-owner.js";
