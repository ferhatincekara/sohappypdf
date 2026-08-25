import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.js";

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
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("admin_audit_events_created_at_idx").on(table.createdAt),
    index("admin_audit_events_actor_user_id_idx").on(table.actorUserId),
    check("admin_audit_events_action_not_empty", sql`${table.action} <> ''`),
    check(
      "admin_audit_events_target_type_not_empty",
      sql`${table.targetType} <> ''`,
    ),
    check(
      "admin_audit_events_target_id_not_empty",
      sql`${table.targetId} <> ''`,
    ),
  ],
);

export type AdminAuditEventRow = typeof adminAuditEvents.$inferSelect;
export type NewAdminAuditEventRow = typeof adminAuditEvents.$inferInsert;
