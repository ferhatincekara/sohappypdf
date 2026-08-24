import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const billingPlanEnum = pgEnum("billing_plan", ["free", "pro"]);

export const billingSubscriptionStatusEnum = pgEnum(
  "billing_subscription_status",
  [
    "incomplete",
    "incomplete_expired",
    "trialing",
    "active",
    "past_due",
    "canceled",
    "unpaid",
    "revoked",
    "paused",
  ],
);

export const billingCustomers = pgTable(
  "billing_customers",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    polarCustomerId: text("polar_customer_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("billing_customers_polar_customer_id_uidx").on(
      table.polarCustomerId,
    ),
  ],
);

export const billingSubscriptions = pgTable(
  "billing_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    polarSubscriptionId: text("polar_subscription_id").notNull(),
    polarProductId: text("polar_product_id").notNull(),
    plan: billingPlanEnum("plan").notNull(),
    status: billingSubscriptionStatusEnum("status").notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
      mode: "date",
    }),
    currentPeriodEnd: timestamp("current_period_end", {
      withTimezone: true,
      mode: "date",
    }),
    endedAt: timestamp("ended_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("billing_subscriptions_polar_subscription_id_uidx").on(
      table.polarSubscriptionId,
    ),
    index("billing_subscriptions_user_id_idx").on(table.userId),
  ],
);

export const usagePeriods = pgTable(
  "usage_periods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    periodStart: timestamp("period_start", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    periodEnd: timestamp("period_end", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    conversionsUsed: integer("conversions_used").notNull().default(0),
    webCreditsGranted: integer("web_credits_granted").notNull().default(0),
    webCreditsUsed: integer("web_credits_used").notNull().default(0),
    aiCreditsGranted: integer("ai_credits_granted").notNull().default(0),
    aiCreditsUsed: integer("ai_credits_used").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("usage_periods_user_id_period_start_uidx").on(
      table.userId,
      table.periodStart,
    ),
    check(
      "usage_periods_conversions_used_non_negative",
      sql`${table.conversionsUsed} >= 0`,
    ),
    check(
      "usage_periods_web_credits_granted_non_negative",
      sql`${table.webCreditsGranted} >= 0`,
    ),
    check(
      "usage_periods_web_credits_used_non_negative",
      sql`${table.webCreditsUsed} >= 0`,
    ),
    check(
      "usage_periods_web_credits_used_lte_granted",
      sql`${table.webCreditsUsed} <= ${table.webCreditsGranted}`,
    ),
    check(
      "usage_periods_ai_credits_granted_non_negative",
      sql`${table.aiCreditsGranted} >= 0`,
    ),
    check(
      "usage_periods_ai_credits_used_non_negative",
      sql`${table.aiCreditsUsed} >= 0`,
    ),
    check(
      "usage_periods_ai_credits_used_lte_granted",
      sql`${table.aiCreditsUsed} <= ${table.aiCreditsGranted}`,
    ),
  ],
);

export const conversionUsageEvents = pgTable(
  "conversion_usage_events",
  {
    conversionId: uuid("conversion_id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    periodStart: timestamp("period_start", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("conversion_usage_events_user_id_idx").on(table.userId)],
);

export const creditLedgerTypeEnum = pgEnum("credit_ledger_type", [
  "grant",
  "consume",
  "refund",
  "adjustment",
]);

export const creditLedgerSourceEnum = pgEnum("credit_ledger_source", [
  "web",
  "api",
  "ai",
]);

export const webCreditLedgerEntries = pgTable(
  "web_credit_ledger_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    type: creditLedgerTypeEnum("type").notNull(),
    source: creditLedgerSourceEnum("source").notNull().default("web"),
    reason: text("reason").notNull(),
    toolId: text("tool_id"),
    executionId: uuid("execution_id"),
    periodStart: timestamp("period_start", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("web_credit_ledger_entries_user_id_idx").on(table.userId),
    index("web_credit_ledger_entries_execution_id_idx").on(table.executionId),
    check(
      "web_credit_ledger_entries_amount_positive",
      sql`${table.amount} > 0`,
    ),
  ],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    processedAt: timestamp("processed_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("webhook_events_provider_event_id_uidx").on(
      table.provider,
      table.eventId,
    ),
  ],
);

export type BillingCustomerRow = typeof billingCustomers.$inferSelect;
export type NewBillingCustomerRow = typeof billingCustomers.$inferInsert;
export type BillingSubscriptionRow = typeof billingSubscriptions.$inferSelect;
export type NewBillingSubscriptionRow =
  typeof billingSubscriptions.$inferInsert;
export type UsagePeriodRow = typeof usagePeriods.$inferSelect;
export type NewUsagePeriodRow = typeof usagePeriods.$inferInsert;
export type ConversionUsageEventRow = typeof conversionUsageEvents.$inferSelect;
export type WebCreditLedgerEntryRow =
  typeof webCreditLedgerEntries.$inferSelect;
export type NewWebCreditLedgerEntryRow =
  typeof webCreditLedgerEntries.$inferInsert;
export type WebhookEventRow = typeof webhookEvents.$inferSelect;
export type NewWebhookEventRow = typeof webhookEvents.$inferInsert;
