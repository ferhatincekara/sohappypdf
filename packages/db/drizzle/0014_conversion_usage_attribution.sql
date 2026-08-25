ALTER TABLE "conversion_usage_events" ADD COLUMN "api_key_id" uuid;--> statement-breakpoint
ALTER TABLE "conversion_usage_events" ADD COLUMN "tool_id" text;--> statement-breakpoint
ALTER TABLE "conversion_usage_events" ADD CONSTRAINT "conversion_usage_events_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversion_usage_events_api_key_id_idx" ON "conversion_usage_events" USING btree ("api_key_id");
