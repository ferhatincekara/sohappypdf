CREATE TYPE "public"."resource_owner_kind" AS ENUM('user', 'anonymous_session');--> statement-breakpoint
CREATE TABLE "anonymous_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "anonymous_sessions_token_hash_uidx" ON "anonymous_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "anonymous_sessions_expires_at_idx" ON "anonymous_sessions" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_owner_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "conversions" DROP CONSTRAINT "conversions_owner_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "owner_kind" "resource_owner_kind" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversions" ADD COLUMN "owner_kind" "resource_owner_kind" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversions" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "files_owner_kind_owner_id_idx" ON "files" USING btree ("owner_kind","owner_id");--> statement-breakpoint
CREATE INDEX "conversions_owner_kind_owner_id_idx" ON "conversions" USING btree ("owner_kind","owner_id");--> statement-breakpoint
CREATE INDEX "conversions_expires_at_idx" ON "conversions" USING btree ("expires_at");
