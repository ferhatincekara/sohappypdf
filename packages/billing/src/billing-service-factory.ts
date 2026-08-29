import { loadBillingConfig } from "@sohappypdf/config";
import { getDb } from "@sohappypdf/db";
import { createBillingRepository } from "./billing-repository.js";
import {
  type BillingService,
  createBillingService,
} from "./billing-service.js";
import { buildPlanCatalog } from "./plan-config.js";
import { createPolarClient } from "./polar-client.js";

let billingService: BillingService | undefined;

export function getBillingService(): BillingService {
  if (billingService === undefined) {
    const config = loadBillingConfig();
    billingService = createBillingService({
      repository: createBillingRepository(getDb()),
      config,
      planCatalog: buildPlanCatalog(),
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
