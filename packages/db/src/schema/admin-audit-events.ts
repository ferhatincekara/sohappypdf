import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const ADMIN_AUDIT_RESULTS = ["success", "failure"] as const;

export type AdminAuditResult = (typeof ADMIN_AUDIT_RESULTS)[number];

export const adminAuditEvents = pgTable(
  "admin_audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason"),
    result: text("result").notNull().default("success"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("admin_audit_events_created_at_idx").on(table.createdAt),
    index("admin_audit_events_actor_user_id_idx").on(table.actorUserId),
    index("admin_audit_events_action_idx").on(table.action),
    check("admin_audit_events_action_not_empty", sql`${table.action} <> ''`),
    check(
      "admin_audit_events_target_type_not_empty",
      sql`${table.targetType} <> ''`,
    ),
    check(
      "admin_audit_events_target_id_not_empty",
      sql`${table.targetId} <> ''`,
    ),
    check(
      "admin_audit_events_result_known",
      sql`${table.result} in ('success', 'failure')`,
    ),
  ],
);

export type AdminAuditEventRow = typeof adminAuditEvents.$inferSelect;
export type NewAdminAuditEventRow = typeof adminAuditEvents.$inferInsert;
