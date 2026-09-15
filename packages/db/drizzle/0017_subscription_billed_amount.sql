ALTER TABLE "billing_subscriptions" ADD COLUMN "amount_cents" integer;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD COLUMN "recurring_interval" text;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_amount_cents_non_negative" CHECK ("amount_cents" is null or "amount_cents" >= 0);--> statement-breakpoint
ALTER TABLE "api_subscriptions" ADD COLUMN "amount_cents" integer;--> statement-breakpoint
ALTER TABLE "api_subscriptions" ADD COLUMN "recurring_interval" text;--> statement-breakpoint
ALTER TABLE "api_subscriptions" ADD CONSTRAINT "api_subscriptions_amount_cents_non_negative" CHECK ("amount_cents" is null or "amount_cents" >= 0);
