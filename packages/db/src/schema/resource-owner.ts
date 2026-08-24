import { pgEnum } from "drizzle-orm/pg-core";

export const RESOURCE_OWNER_KINDS = ["user", "anonymous_session"] as const;

export type ResourceOwnerKind = (typeof RESOURCE_OWNER_KINDS)[number];

export const resourceOwnerKindEnum = pgEnum(
  "resource_owner_kind",
  RESOURCE_OWNER_KINDS,
);
