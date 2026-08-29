import type { AxiosInstance } from "axios";
import { apiClient } from "@/lib/api/client";
import type {
  BillingCheckoutResponse,
  BillingInterval,
  BillingPortalResponse,
  BillingStatusResponse,
  CheckoutProductKey,
} from "../types/billing";
import { toBillingClientError } from "./billing-errors";

export class BillingApiRequestError extends Error {
  readonly clientError: ReturnType<typeof toBillingClientError>;

  constructor(error: unknown) {
    super("Billing request failed");
    this.name = "BillingApiRequestError";
    this.clientError = toBillingClientError(error);
  }
}

export type BillingApi = {
  getStatus: () => Promise<BillingStatusResponse>;
  createCheckout: (
    product?: CheckoutProductKey,
    interval?: BillingInterval,
  ) => Promise<BillingCheckoutResponse>;
  createPortal: () => Promise<BillingPortalResponse>;
};

export function createBillingApi(
  client: AxiosInstance = apiClient,
): BillingApi {
  return {
    async getStatus() {
      try {
        const response =
          await client.get<BillingStatusResponse>("/v1/billing");
        return response.data;
      } catch (error) {
        throw new BillingApiRequestError(error);
      }
    },

    async createCheckout(
      product: CheckoutProductKey = "pro",
      interval: BillingInterval = "monthly",
    ) {
      try {
        const response = await client.post<BillingCheckoutResponse>(
          "/v1/billing/checkout",
          { product, interval },
        );
        return response.data;
      } catch (error) {
        throw new BillingApiRequestError(error);
      }
    },

    async createPortal() {
      try {
        const response = await client.post<BillingPortalResponse>(
          "/v1/billing/portal",
        );
        return response.data;
      } catch (error) {
        throw new BillingApiRequestError(error);
      }
    },
  };
}

export const billingApi = createBillingApi();
