import type { PublicApiKey } from "../types/api-key";

export function isApiKeyRevocable(apiKey: PublicApiKey): boolean {
  return apiKey.status !== "revoked" && apiKey.revokedAt === null;
}
