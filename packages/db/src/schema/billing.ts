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
export type WebhookEventRow = typeof webhookEvents.$inferSelect;
export type NewWebhookEventRow = typeof webhookEvents.$inferInsert;
