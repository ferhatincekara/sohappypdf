CREATE TYPE "public"."billing_plan" AS ENUM('free', 'pro');--> statement-breakpoint
CREATE TYPE "public"."billing_subscription_status" AS ENUM('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'revoked', 'paused');--> statement-breakpoint
CREATE TABLE "billing_customers" (
	"user_id" text PRIMARY KEY NOT NULL,
	"polar_customer_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"polar_subscription_id" text NOT NULL,
	"polar_product_id" text NOT NULL,
	"plan" "billing_plan" NOT NULL,
	"status" "billing_subscription_status" NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversion_usage_events" (
	"conversion_id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"conversions_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_periods_conversions_used_non_negative" CHECK ("usage_periods"."conversions_used" >= 0)
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"processed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing_customers" ADD CONSTRAINT "billing_customers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversion_usage_events" ADD CONSTRAINT "conversion_usage_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_periods" ADD CONSTRAINT "usage_periods_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_customers_polar_customer_id_uidx" ON "billing_customers" USING btree ("polar_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_subscriptions_polar_subscription_id_uidx" ON "billing_subscriptions" USING btree ("polar_subscription_id");--> statement-breakpoint
CREATE INDEX "billing_subscriptions_user_id_idx" ON "billing_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversion_usage_events_user_id_idx" ON "conversion_usage_events" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_periods_user_id_period_start_uidx" ON "usage_periods" USING btree ("user_id","period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_provider_event_id_uidx" ON "webhook_events" USING btree ("provider","event_id");