import { Polar } from "@polar-sh/sdk";
import type { PolarServer } from "@repo/config";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { PolarClient } from "./billing-types.js";

export type CreatePolarClientOptions = {
  accessToken: string;
  server: PolarServer;
};

function requireUrl(url: string | undefined, action: string): string {
  if (url === undefined || url.length === 0) {
    throw new AppError({
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      message: `Polar ${action} did not return a URL`,
    });
  }

  return url;
}

export function createPolarClient(
  options: CreatePolarClientOptions,
): PolarClient {
  const polar = new Polar({
    accessToken: options.accessToken,
    server: options.server,
  });

  return {
    async findCustomerByExternalId(externalId) {
      try {
        const customer = await polar.customers.getExternal({
          externalId,
        });

        if (typeof customer.id !== "string" || customer.id.length === 0) {
          return null;
        }

        return { id: customer.id };
      } catch {
        return null;
      }
    },

    async createCustomer(input) {
      const customer = await polar.customers.create({
        email: input.email,
        externalId: input.externalId,
      });

      if (typeof customer.id !== "string" || customer.id.length === 0) {
        throw new AppError({
          code: APP_ERROR_CODES.INTERNAL_ERROR,
          message: "Polar customer could not be created",
        });
      }

      return { id: customer.id };
    },

    async createCheckout(input) {
      const checkout = await polar.checkouts.create({
        products: [input.productId],
        externalCustomerId: input.externalCustomerId,
        successUrl: input.successUrl,
      });

      return { url: requireUrl(checkout.url, "checkout") };
    },

    async createCustomerPortal(input) {
      const session = await polar.customerSessions.create({
        customerId: input.customerId,
      });

      return {
        url: requireUrl(session.customerPortalUrl, "customer portal"),
      };
    },
  };
}
