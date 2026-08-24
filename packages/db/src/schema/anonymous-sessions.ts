import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const anonymousSessions = pgTable(
  "anonymous_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    lastSeenAt: timestamp("last_seen_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("anonymous_sessions_token_hash_uidx").on(table.tokenHash),
    index("anonymous_sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export type AnonymousSessionRow = typeof anonymousSessions.$inferSelect;
export type NewAnonymousSessionRow = typeof anonymousSessions.$inferInsert;
