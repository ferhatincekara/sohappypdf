import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { files } from "./files.js";

export const conversionStatusEnum = pgEnum("conversion_status", [
  "pending",
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
]);

export const conversions = pgTable(
  "conversions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceFileId: uuid("source_file_id")
      .notNull()
      .references(() => files.id),
    outputFileId: uuid("output_file_id").references(() => files.id),
    conversionType: text("conversion_type").notNull(),
    sourceFormat: text("source_format").notNull(),
    targetFormat: text("target_format").notNull(),
    status: conversionStatusEnum("status").notNull().default("pending"),
    options: jsonb("options")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    queuedAt: timestamp("queued_at", { withTimezone: true, mode: "date" }),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [
    index("conversions_source_file_id_idx").on(table.sourceFileId),
    index("conversions_status_idx").on(table.status),
    uniqueIndex("conversions_idempotency_key_uidx")
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);

export type ConversionRow = typeof conversions.$inferSelect;
export type NewConversionRow = typeof conversions.$inferInsert;
