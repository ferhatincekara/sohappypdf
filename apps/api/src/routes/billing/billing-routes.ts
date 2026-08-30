import type { ApiKeyService } from "@sohappypdf/api-keys";
import {
  type BillingInterval,
  type BillingService,
  type CheckoutProductKey,
  isBillingInterval,
  isCheckoutProductKey,
  resolvePolarCheckoutLocale,
} from "@sohappypdf/billing";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import type { FileService } from "@sohappypdf/files";
import { Hono } from "hono";
import type { AppEnv } from "../../app-env.js";
import { requireSessionIdentity } from "../../auth/request-identity.js";
import { requireAuthMiddleware } from "../../middleware/require-auth.js";

export type BillingRoutesOptions = {
  getBillingService: () => BillingService;
  getFileService: () => FileService;
  getApiKeyService: () => ApiKeyService;
};

function countActiveApiKeys(
  keys: Awaited<ReturnType<ApiKeyService["listByUserId"]>>,
): number {
  return keys.filter((key) => key.revokedAt === null).length;
}

function webhookHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {};

  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return headers;
}

export function createBillingRoutes(options: BillingRoutesOptions) {
  const billing = new Hono<AppEnv>();
  const managed = new Hono<AppEnv>();

  billing.get("/catalog", async (c) => {
    const prices = await options.getBillingService().getCatalogPrices();
    return c.json({ prices });
  });

  billing.post("/webhooks", async (c) => {
    const body = await c.req.text();
    const result = await options.getBillingService().handleWebhook({
      body,
      headers: webhookHeaders(c.req.raw),
    });

    c.get("logger").info("billing webhook processed", {
      outcome: result.outcome,
    });

    return c.json({ received: true, outcome: result.outcome }, 202);
  });

  managed.use("*", requireAuthMiddleware());

  managed.get("/", async (c) => {
    const identity = requireSessionIdentity(c.get("identity"));
    const [storageUsedBytes, apiKeys] = await Promise.all([
      options.getFileService().sumActiveStorageBytes(identity.userId),
      options.getApiKeyService().listByUserId(identity.userId),
    ]);
    const billingStatus = await options.getBillingService().getBillingStatus({
      userId: identity.userId,
      storageUsedBytes,
      apiKeyCount: countActiveApiKeys(apiKeys),
    });

    return c.json({ billing: billingStatus });
  });

  managed.get("/usage", async (c) => {
    const identity = requireSessionIdentity(c.get("identity"));
    const [storageUsedBytes, apiKeys] = await Promise.all([
      options.getFileService().sumActiveStorageBytes(identity.userId),
      options.getApiKeyService().listByUserId(identity.userId),
    ]);
    const billingStatus = await options.getBillingService().getBillingStatus({
      userId: identity.userId,
      storageUsedBytes,
      apiKeyCount: countActiveApiKeys(apiKeys),
    });

    return c.json({ usage: billingStatus.usage });
  });

  managed.post("/checkout", async (c) => {
    const identity = requireSessionIdentity(c.get("identity"));
    const { product, interval, locale } = await parseCheckoutRequest(c.req.raw);
    const checkout = await options
      .getBillingService()
      .createCheckout(identity.userId, product, interval, locale);

    if (checkout.url === null) {
      c.get("logger").info("billing api pack updated", {
        userId: identity.userId,
      });
      return c.json({ checkout });
    }

    c.get("logger").info("billing checkout created", {
      userId: identity.userId,
    });

    return c.json({ checkout }, 201);
  });

  managed.post("/portal", async (c) => {
    const identity = requireSessionIdentity(c.get("identity"));
    const portal = await options
      .getBillingService()
      .createCustomerPortal(identity.userId);

    c.get("logger").info("billing portal created", {
      userId: identity.userId,
    });

    return c.json({ portal });
  });

  billing.route("/", managed);
  return billing;
}

async function parseCheckoutRequest(request: Request): Promise<{
  product: CheckoutProductKey;
  interval: BillingInterval;
  locale?: string;
}> {
  const text = await request.text();

  if (text.trim().length === 0) {
    return { product: "pro", interval: "monthly" };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid request",
    });
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid request",
    });
  }

  let product: CheckoutProductKey = "pro";
  let interval: BillingInterval = "monthly";
  let locale: string | undefined;

  if ("product" in parsed && parsed.product !== undefined) {
    if (
      typeof parsed.product !== "string" ||
      !isCheckoutProductKey(parsed.product)
    ) {
      throw new AppError({
        code: APP_ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid checkout product",
      });
    }

    product = parsed.product;
  }

  if ("interval" in parsed && parsed.interval !== undefined) {
    if (
      typeof parsed.interval !== "string" ||
      !isBillingInterval(parsed.interval)
    ) {
      throw new AppError({
        code: APP_ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid checkout interval",
      });
    }

    interval = parsed.interval;
  }

  if ("locale" in parsed && parsed.locale !== undefined) {
    if (typeof parsed.locale !== "string") {
      throw new AppError({
        code: APP_ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid checkout locale",
      });
    }

    locale = resolvePolarCheckoutLocale(parsed.locale);
  }

  return { product, interval, locale };
}
