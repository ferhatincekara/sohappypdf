import type { ApiKeyService } from "@repo/api-keys";
import {
  type BillingService,
  type CheckoutProductKey,
  isCheckoutProductKey,
} from "@repo/billing";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { FileService } from "@repo/files";
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
    const product = await parseCheckoutProduct(c.req.raw);
    const checkout = await options
      .getBillingService()
      .createCheckout(identity.userId, product);

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

async function parseCheckoutProduct(
  request: Request,
): Promise<CheckoutProductKey> {
  const text = await request.text();

  if (text.trim().length === 0) {
    return "pro";
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

  if (!("product" in parsed) || parsed.product === undefined) {
    return "pro";
  }

  if (
    typeof parsed.product !== "string" ||
    !isCheckoutProductKey(parsed.product)
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid checkout product",
    });
  }

  return parsed.product;
}
