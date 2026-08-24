ALTER TABLE "usage_periods" ADD COLUMN "ai_credits_granted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage_periods" ADD COLUMN "ai_credits_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage_periods" ADD CONSTRAINT "usage_periods_ai_credits_granted_non_negative" CHECK ("ai_credits_granted" >= 0);--> statement-breakpoint
ALTER TABLE "usage_periods" ADD CONSTRAINT "usage_periods_ai_credits_used_non_negative" CHECK ("ai_credits_used" >= 0);--> statement-breakpoint
ALTER TABLE "usage_periods" ADD CONSTRAINT "usage_periods_ai_credits_used_lte_granted" CHECK ("ai_credits_used" <= "ai_credits_granted");--> statement-breakpoint
CREATE UNIQUE INDEX "web_credit_ledger_ai_grant_period_uidx" ON "web_credit_ledger_entries" USING btree ("user_id","period_start","source") WHERE "type" = 'grant' AND "source" = 'ai';
