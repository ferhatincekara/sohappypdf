import type { ApiKeyService } from "@repo/api-keys";
import type { BillingService } from "@repo/billing";
import { Hono } from "hono";
import type { AppEnv } from "../../app-env.js";
import { requireSessionIdentity } from "../../auth/request-identity.js";
import { requireAuthMiddleware } from "../../middleware/require-auth.js";
import {
  toCreatedApiKeyResponse,
  toPublicApiKey,
} from "./api-key-presenter.js";
import {
  parseApiKeyId,
  parseCreateApiKey,
  readJsonBody,
} from "./api-key-schemas.js";

export type ApiKeyRoutesOptions = {
  getApiKeyService: () => ApiKeyService;
  getBillingService: () => BillingService;
};

export function createApiKeyRoutes(options: ApiKeyRoutesOptions) {
  const apiKeys = new Hono<AppEnv>();

  apiKeys.use("*", requireAuthMiddleware());

  apiKeys.post("/", async (c) => {
    const identity = requireSessionIdentity(c.get("identity"));
    const body = parseCreateApiKey(await readJsonBody(c.req.raw));
    const existing = await options
      .getApiKeyService()
      .listByUserId(identity.userId);
    await options.getBillingService().assertCanCreateApiKey({
      userId: identity.userId,
      used: existing.filter((key) => key.revokedAt === null).length,
    });
    const created = await options.getApiKeyService().create({
      userId: identity.userId,
      name: body.name,
    });

    c.get("logger").info("api key created", {
      apiKeyId: created.apiKey.id,
      userId: identity.userId,
    });

    return c.json(toCreatedApiKeyResponse(created), 201);
  });

  apiKeys.get("/", async (c) => {
    const identity = requireSessionIdentity(c.get("identity"));
    const records = await options
      .getApiKeyService()
      .listByUserId(identity.userId);

    return c.json({
      apiKeys: records.map((record) => toPublicApiKey(record)),
    });
  });

  apiKeys.delete("/:id", async (c) => {
    const identity = requireSessionIdentity(c.get("identity"));
    const apiKey = await options.getApiKeyService().revoke({
      id: parseApiKeyId(c.req.param("id")),
      userId: identity.userId,
    });

    c.get("logger").info("api key revoked", {
      apiKeyId: apiKey.id,
      userId: identity.userId,
    });

    return c.json({ apiKey: toPublicApiKey(apiKey) });
  });

  return apiKeys;
}
