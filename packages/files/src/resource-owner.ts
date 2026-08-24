export const RESOURCE_OWNER_KINDS = ["user", "anonymous_session"] as const;

export type ResourceOwnerKind = (typeof RESOURCE_OWNER_KINDS)[number];

export const DEFAULT_RESOURCE_OWNER_KIND: ResourceOwnerKind = "user";

export function isResourceOwnerKind(value: string): value is ResourceOwnerKind {
  return RESOURCE_OWNER_KINDS.some((kind) => kind === value);
}
