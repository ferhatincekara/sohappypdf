ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "suspended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "suspended_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_known" CHECK ("role" in ('user', 'admin'));--> statement-breakpoint
CREATE INDEX "user_created_at_idx" ON "user" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_suspended_at_idx" ON "user" USING btree ("suspended_at");--> statement-breakpoint
ALTER TABLE "admin_audit_events" ADD COLUMN "result" text DEFAULT 'success' NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_audit_events" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_audit_events" ADD CONSTRAINT "admin_audit_events_result_known" CHECK ("result" in ('success', 'failure'));--> statement-breakpoint
CREATE INDEX "admin_audit_events_action_idx" ON "admin_audit_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "conversions_created_at_id_idx" ON "conversions" USING btree ("created_at", "id");--> statement-breakpoint
CREATE INDEX "conversions_status_created_at_idx" ON "conversions" USING btree ("status", "created_at");
