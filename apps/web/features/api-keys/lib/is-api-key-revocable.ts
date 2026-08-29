import type { PublicApiKey } from "@/features/api-keys/types/api-key";

export function isApiKeyRevocable(apiKey: PublicApiKey): boolean {
  return apiKey.status !== "revoked" && apiKey.revokedAt === null;
}
