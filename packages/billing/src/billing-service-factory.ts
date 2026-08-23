import { loadBillingConfig } from "@repo/config";
import { getDb } from "@repo/db";
import { createBillingRepository } from "./billing-repository.js";
import {
  type BillingService,
  createBillingService,
} from "./billing-service.js";
import { createPolarClient } from "./polar-client.js";

let billingService: BillingService | undefined;

export function getBillingService(): BillingService {
  if (billingService === undefined) {
    const config = loadBillingConfig();
    billingService = createBillingService({
      repository: createBillingRepository(getDb()),
      config,
      polarClient:
        config.polar.accessToken === undefined
          ? undefined
          : createPolarClient({
              accessToken: config.polar.accessToken,
              server: config.polar.server,
            }),
    });
  }

  return billingService;
}
