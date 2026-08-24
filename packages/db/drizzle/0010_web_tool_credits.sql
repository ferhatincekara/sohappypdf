CREATE TYPE "public"."credit_ledger_type" AS ENUM('grant', 'consume', 'refund', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."credit_ledger_source" AS ENUM('web', 'api', 'ai');--> statement-breakpoint
ALTER TABLE "usage_periods" ADD COLUMN "web_credits_granted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage_periods" ADD COLUMN "web_credits_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage_periods" ADD CONSTRAINT "usage_periods_web_credits_granted_non_negative" CHECK ("web_credits_granted" >= 0);--> statement-breakpoint
ALTER TABLE "usage_periods" ADD CONSTRAINT "usage_periods_web_credits_used_non_negative" CHECK ("web_credits_used" >= 0);--> statement-breakpoint
ALTER TABLE "usage_periods" ADD CONSTRAINT "usage_periods_web_credits_used_lte_granted" CHECK ("web_credits_used" <= "web_credits_granted");--> statement-breakpoint
CREATE TABLE "web_credit_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"type" "credit_ledger_type" NOT NULL,
	"source" "credit_ledger_source" DEFAULT 'web' NOT NULL,
	"reason" text NOT NULL,
	"tool_id" text,
	"execution_id" uuid,
	"period_start" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "web_credit_ledger_entries_amount_positive" CHECK ("amount" > 0)
);--> statement-breakpoint
ALTER TABLE "web_credit_ledger_entries" ADD CONSTRAINT "web_credit_ledger_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "web_credit_ledger_entries_user_id_idx" ON "web_credit_ledger_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "web_credit_ledger_entries_execution_id_idx" ON "web_credit_ledger_entries" USING btree ("execution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "web_credit_ledger_consume_execution_uidx" ON "web_credit_ledger_entries" USING btree ("execution_id") WHERE "type" = 'consume' AND "execution_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "web_credit_ledger_refund_execution_uidx" ON "web_credit_ledger_entries" USING btree ("execution_id") WHERE "type" = 'refund' AND "execution_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "web_credit_ledger_grant_period_uidx" ON "web_credit_ledger_entries" USING btree ("user_id","period_start","source") WHERE "type" = 'grant' AND "source" = 'web';
