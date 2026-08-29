import type { PolarConfig } from "@sohappypdf/config";
import {
  apiPackYearlyPriceUsd,
  type BillingCatalogPrices,
  fallbackCatalogPrices,
} from "./default-plan-limits.js";

type CatalogOfferId = "pro" | "starter" | "growth" | "scale";

type OfferInterval = "monthly" | "yearly";

export type PolarPriceTarget = {
  offer: CatalogOfferId;
  interval: OfferInterval;
  productId: string;
};

const CATALOG_CACHE_MS = 15 * 60 * 1000;

function jsonRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

export function usdFromPolarProduct(product: unknown): number | undefined {
  const record = jsonRecord(product);

  if (record === undefined) {
    return undefined;
  }

  if (!Array.isArray(record.prices)) {
    return undefined;
  }

  for (const item of record.prices) {
    const price = jsonRecord(item);

    if (price === undefined) {
      continue;
    }

    if (price.isArchived === true || price.is_archived === true) {
      continue;
    }

    const amountType = price.amountType ?? price.amount_type;

    if (amountType !== "fixed") {
      continue;
    }

    const cents = price.priceAmount ?? price.price_amount;

    if (typeof cents !== "number" || !Number.isFinite(cents) || cents <= 0) {
      continue;
    }

    return cents / 100;
  }

  return undefined;
}

export function collectPolarPriceTargets(
  polar: PolarConfig,
): readonly PolarPriceTarget[] {
  const targets: PolarPriceTarget[] = [];

  function add(
    offer: CatalogOfferId,
    interval: OfferInterval,
    productId: string | undefined,
  ) {
    if (productId !== undefined && productId.length > 0) {
      targets.push({ offer, interval, productId });
    }
  }

  add("pro", "monthly", polar.proProductId);
  add("pro", "yearly", polar.proYearlyProductId);
  add("starter", "monthly", polar.apiStarterProductId);
  add("starter", "yearly", polar.apiStarterYearlyProductId);
  add("growth", "monthly", polar.apiGrowthProductId);
  add("growth", "yearly", polar.apiGrowthYearlyProductId);
  add("scale", "monthly", polar.apiScaleProductId);
  add("scale", "yearly", polar.apiScaleYearlyProductId);

  return targets;
}

export function mergePolarCatalogPrices(
  fallback: BillingCatalogPrices,
  fetched: readonly {
    offer: CatalogOfferId;
    interval: OfferInterval;
    usd: number | undefined;
  }[],
): BillingCatalogPrices {
  const next: BillingCatalogPrices = {
    pro: { ...fallback.pro },
    starter: { ...fallback.starter },
    growth: { ...fallback.growth },
    scale: { ...fallback.scale },
  };
  const yearlyFromPolar = new Set<CatalogOfferId>();

  for (const item of fetched) {
    if (item.usd === undefined) {
      continue;
    }

    if (item.interval === "monthly") {
      next[item.offer].monthlyUsd = item.usd;
      continue;
    }

    next[item.offer].yearlyUsd = item.usd;
    yearlyFromPolar.add(item.offer);
  }

  for (const offer of ["starter", "growth", "scale"] as const) {
    if (!yearlyFromPolar.has(offer)) {
      next[offer].yearlyUsd = apiPackYearlyPriceUsd(next[offer].monthlyUsd);
    }
  }

  return next;
}

export function createCatalogPriceLoader(input: {
  polar: PolarConfig;
  getProduct?: (id: string) => Promise<unknown | null>;
}): () => Promise<BillingCatalogPrices> {
  let cache:
    | {
        expiresAt: number;
        value: BillingCatalogPrices;
      }
    | undefined;

  return async () => {
    const now = Date.now();

    if (cache !== undefined && cache.expiresAt > now) {
      return cache.value;
    }

    const fallback = fallbackCatalogPrices();

    if (input.getProduct === undefined) {
      cache = { expiresAt: now + CATALOG_CACHE_MS, value: fallback };
      return fallback;
    }

    const fetched = await Promise.all(
      collectPolarPriceTargets(input.polar).map(async (target) => {
        try {
          const product = await input.getProduct?.(target.productId);
          return {
            offer: target.offer,
            interval: target.interval,
            usd: usdFromPolarProduct(product),
          };
        } catch {
          return {
            offer: target.offer,
            interval: target.interval,
            usd: undefined,
          };
        }
      }),
    );
    const value = mergePolarCatalogPrices(fallback, fetched);
    cache = { expiresAt: now + CATALOG_CACHE_MS, value };
    return value;
  };
}
