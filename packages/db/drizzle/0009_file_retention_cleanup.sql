ALTER TABLE "files" ADD COLUMN "purged_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "files_purged_at_idx" ON "files" USING btree ("purged_at");--> statement-breakpoint
CREATE INDEX "files_cleanup_eligible_idx" ON "files" USING btree ("expires_at") WHERE "purged_at" is null;
