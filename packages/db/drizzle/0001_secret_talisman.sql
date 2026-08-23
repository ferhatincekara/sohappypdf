CREATE TYPE "public"."conversion_status" AS ENUM('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_file_id" uuid NOT NULL,
	"output_file_id" uuid,
	"conversion_type" text NOT NULL,
	"source_format" text NOT NULL,
	"target_format" text NOT NULL,
	"status" "conversion_status" DEFAULT 'pending' NOT NULL,
	"options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_code" text,
	"error_message" text,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"queued_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_source_file_id_files_id_fk" FOREIGN KEY ("source_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_output_file_id_files_id_fk" FOREIGN KEY ("output_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversions_source_file_id_idx" ON "conversions" USING btree ("source_file_id");--> statement-breakpoint
CREATE INDEX "conversions_status_idx" ON "conversions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "conversions_idempotency_key_uidx" ON "conversions" USING btree ("idempotency_key") WHERE "conversions"."idempotency_key" is not null;