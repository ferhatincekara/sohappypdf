import { describe, expect, test } from "bun:test";
import {
  BILLING_ERROR_KEYS,
  mapBillingError,
} from "@/features/billing/api/billing-errors";

describe("billing error mapping", () => {
  test("maps unauthorized and configuration failures", () => {
    expect(
      mapBillingError({ kind: "api", code: "UNAUTHORIZED", status: 401 }),
    ).toBe(BILLING_ERROR_KEYS.unauthorized);
    expect(
      mapBillingError({
        kind: "api",
        code: "CONFIGURATION_ERROR",
        status: 500,
      }),
    ).toBe(BILLING_ERROR_KEYS.configuration);
    expect(
      mapBillingError({ kind: "api", code: "NOT_FOUND", status: 404 }),
    ).toBe(BILLING_ERROR_KEYS.notFound);
    expect(
      mapBillingError({ kind: "api", code: "VALIDATION_ERROR", status: 422 }),
    ).toBe(BILLING_ERROR_KEYS.portalUnavailable);
    expect(
      mapBillingError({ kind: "api", code: "INTERNAL_ERROR", status: 500 }),
    ).toBe(BILLING_ERROR_KEYS.unexpected);
  });

  test("maps a network failure", () => {
    expect(mapBillingError({ kind: "network", status: 0 })).toBe(
      BILLING_ERROR_KEYS.networkFailure,
    );
  });
});
