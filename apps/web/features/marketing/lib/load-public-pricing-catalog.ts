import {
  type BillingCatalogPrices,
  fallbackCatalogPrices,
} from "@sohappypdf/billing/plans";
import { getServerApiV1BaseUrl } from "@/config/public-env";

const CATALOG_REVALIDATE_SECONDS = 15 * 60;

function jsonRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function isFiniteUsd(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function parseOfferPrice(
  value: unknown,
): { monthlyUsd: number; yearlyUsd: number | null } | undefined {
  const record = jsonRecord(value);

  if (record === undefined || !isFiniteUsd(record.monthlyUsd)) {
    return undefined;
  }

  if (record.yearlyUsd === null) {
    return { monthlyUsd: record.monthlyUsd, yearlyUsd: null };
  }

  if (!isFiniteUsd(record.yearlyUsd)) {
    return undefined;
  }

  return {
    monthlyUsd: record.monthlyUsd,
    yearlyUsd: record.yearlyUsd,
  };
}

export function parseBillingCatalogPrices(
  value: unknown,
): BillingCatalogPrices | undefined {
  const record = jsonRecord(value);
  const prices = jsonRecord(record?.prices);

  if (prices === undefined) {
    return undefined;
  }

  const pro = parseOfferPrice(prices.pro);
  const starter = parseOfferPrice(prices.starter);
  const growth = parseOfferPrice(prices.growth);
  const scale = parseOfferPrice(prices.scale);

  if (
    pro === undefined ||
    starter === undefined ||
    growth === undefined ||
    scale === undefined
  ) {
    return undefined;
  }

  return { pro, starter, growth, scale };
}

export async function loadPublicPricingCatalog(): Promise<BillingCatalogPrices> {
  try {
    const response = await fetch(`${getServerApiV1BaseUrl()}/billing/catalog`, {
      next: { revalidate: CATALOG_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      return fallbackCatalogPrices();
    }

    const parsed = parseBillingCatalogPrices(await response.json());
    return parsed ?? fallbackCatalogPrices();
  } catch {
    return fallbackCatalogPrices();
  }
}
