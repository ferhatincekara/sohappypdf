import { afterEach, describe, expect, test } from "bun:test";
import { APP_ERROR_CODES, isAppError } from "@sohappypdf/core";
import {
  createPolarClient,
  mapPolarRequestError,
  readPolarPortalUrl,
  readPolarValidationSummary,
  resolvePolarReturnUrl,
} from "./polar-client.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("mapPolarRequestError", () => {
  test("maps Polar auth failures to configuration errors", () => {
    const error = mapPolarRequestError(
      { statusCode: 403, message: "forbidden" },
      "customer portal",
    );

    expect(isAppError(error)).toBe(true);
    expect(error.code).toBe(APP_ERROR_CODES.CONFIGURATION_ERROR);
  });

  test("maps Polar missing customers to not found", () => {
    const error = mapPolarRequestError(
      { statusCode: 404, message: "missing" },
      "customer portal",
    );

    expect(error.code).toBe(APP_ERROR_CODES.NOT_FOUND);
  });

  test("maps Polar validation failures", () => {
    const error = mapPolarRequestError(
      { statusCode: 422, message: "invalid" },
      "customer portal",
    );

    expect(error.code).toBe(APP_ERROR_CODES.VALIDATION_ERROR);
  });
});

describe("resolvePolarReturnUrl", () => {
  test("keeps public https URLs and drops local ones", () => {
    expect(
      resolvePolarReturnUrl("https://sohappypdf.com/account/billing"),
    ).toBe("https://sohappypdf.com/account/billing");
    expect(
      resolvePolarReturnUrl("http://localhost:3000/account/billing"),
    ).toBeUndefined();
    expect(
      resolvePolarReturnUrl("https://192.168.1.38:3000/account/billing"),
    ).toBeUndefined();
  });
});

describe("readPolarValidationSummary", () => {
  test("reads Polar 422 field messages", () => {
    expect(
      readPolarValidationSummary({
        detail: [
          {
            loc: ["body", "customer_id"],
            msg: "Input should be a valid UUID",
          },
        ],
      }),
    ).toBe("body.customer_id: Input should be a valid UUID");
  });
});

describe("readPolarPortalUrl", () => {
  test("recovers a portal URL from a Polar SDK parse error body", () => {
    expect(
      readPolarPortalUrl({
        body: JSON.stringify({
          customer_portal_url: "https://polar.sh/portal/session",
        }),
      }),
    ).toBe("https://polar.sh/portal/session");
  });
});

describe("createPolarClient.createCustomerPortal", () => {
  test("opens Polar portal through HTTP customer sessions", async () => {
    globalThis.fetch = async (input, init) => {
      expect(String(input)).toBe("https://api.polar.sh/v1/customer-sessions/");
      expect(init?.method).toBe("POST");
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        "Bearer polar_oat_test",
      );
      expect(init?.body).toBe(
        JSON.stringify({
          customer_id: "00000000-0000-4000-8000-000000000001",
        }),
      );

      return Response.json(
        { customer_portal_url: "https://polar.sh/portal/session" },
        { status: 201 },
      );
    };

    const polar = createPolarClient({
      accessToken: "polar_oat_test",
      server: "production",
    });

    await expect(
      polar.createCustomerPortal({
        externalCustomerId: "user_1",
        customerId: "00000000-0000-4000-8000-000000000001",
      }),
    ).resolves.toEqual({ url: "https://polar.sh/portal/session" });
  });
});
