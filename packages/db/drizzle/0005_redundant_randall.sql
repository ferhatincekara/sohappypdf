DROP INDEX "conversions_idempotency_key_uidx";--> statement-breakpoint
ALTER TABLE "conversions" ADD COLUMN "owner_id" text;--> statement-breakpoint
UPDATE "conversions" SET "owner_id" = "files"."owner_id" FROM "files" WHERE "conversions"."source_file_id" = "files"."id";--> statement-breakpoint
ALTER TABLE "conversions" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversions_owner_id_idx" ON "conversions" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "conversions_owner_id_created_at_id_idx" ON "conversions" USING btree ("owner_id","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "conversions_owner_id_idempotency_key_uidx" ON "conversions" USING btree ("owner_id","idempotency_key") WHERE "conversions"."idempotency_key" is not null;
