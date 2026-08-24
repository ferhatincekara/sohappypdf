CREATE TYPE "public"."api_product_key" AS ENUM('starter', 'growth', 'scale');--> statement-breakpoint
CREATE TABLE "api_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"polar_subscription_id" text NOT NULL,
	"polar_product_id" text NOT NULL,
	"product_key" "api_product_key" NOT NULL,
	"status" "billing_subscription_status" NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "api_subscriptions" ADD CONSTRAINT "api_subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_subscriptions_polar_subscription_id_uidx" ON "api_subscriptions" USING btree ("polar_subscription_id");--> statement-breakpoint
CREATE INDEX "api_subscriptions_user_id_idx" ON "api_subscriptions" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "usage_periods" ADD COLUMN "api_credits_granted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage_periods" ADD COLUMN "api_credits_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage_periods" ADD CONSTRAINT "usage_periods_api_credits_granted_non_negative" CHECK ("api_credits_granted" >= 0);--> statement-breakpoint
ALTER TABLE "usage_periods" ADD CONSTRAINT "usage_periods_api_credits_used_non_negative" CHECK ("api_credits_used" >= 0);--> statement-breakpoint
ALTER TABLE "usage_periods" ADD CONSTRAINT "usage_periods_api_credits_used_lte_granted" CHECK ("api_credits_used" <= "api_credits_granted");--> statement-breakpoint
ALTER TABLE "web_credit_ledger_entries" ADD COLUMN "provider_event_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "web_credit_ledger_api_grant_period_uidx" ON "web_credit_ledger_entries" USING btree ("user_id","period_start","source") WHERE "type" = 'grant' AND "source" = 'api';--> statement-breakpoint
CREATE UNIQUE INDEX "web_credit_ledger_provider_event_uidx" ON "web_credit_ledger_entries" USING btree ("provider_event_id") WHERE "provider_event_id" IS NOT NULL;
