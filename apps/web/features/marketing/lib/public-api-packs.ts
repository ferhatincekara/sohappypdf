import { DEFAULT_API_CREDIT_PACKS } from "@repo/billing/plans";

export const PUBLIC_API_PACK_IDS = ["starter", "growth", "scale"] as const;

export type PublicApiPackId = (typeof PUBLIC_API_PACK_IDS)[number];

export type PublicApiPackPresentation = {
  id: PublicApiPackId;
  monthlyApiCredits: number;
};

export function getPublicApiPacks(): readonly PublicApiPackPresentation[] {
  return PUBLIC_API_PACK_IDS.map((id) => ({
    id,
    monthlyApiCredits: DEFAULT_API_CREDIT_PACKS[id],
  }));
}
