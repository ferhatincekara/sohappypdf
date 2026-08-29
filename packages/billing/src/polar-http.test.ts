import { afterEach, describe, expect, test } from "bun:test";
import { PolarHttpError, polarApiJson } from "./polar-http.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("polarApiJson", () => {
  test("posts JSON to the Polar production host with a bearer token", async () => {
    globalThis.fetch = async (input, init) => {
      expect(String(input)).toBe("https://api.polar.sh/v1/checkouts/");
      expect(init?.method).toBe("POST");
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        "Bearer polar_oat_test",
      );
      expect(init?.body).toBe(
        JSON.stringify({ products: ["prod_1"], customer_email: "a@b.c" }),
      );

      return Response.json(
        { url: "https://polar.sh/checkout/1" },
        { status: 201 },
      );
    };

    await expect(
      polarApiJson({
        accessToken: "polar_oat_test",
        server: "production",
        method: "POST",
        path: "/v1/checkouts/",
        body: { products: ["prod_1"], customer_email: "a@b.c" },
      }),
    ).resolves.toEqual({ url: "https://polar.sh/checkout/1" });
  });

  test("throws PolarHttpError with Polar's error code", async () => {
    globalThis.fetch = async () =>
      Response.json({ error: "insufficient_scope" }, { status: 403 });

    try {
      await polarApiJson({
        accessToken: "polar_oat_test",
        server: "production",
        method: "POST",
        path: "/v1/customers",
        body: { email: "a@b.c" },
      });
      throw new Error("expected PolarHttpError");
    } catch (error) {
      expect(error).toBeInstanceOf(PolarHttpError);
      expect(error).toMatchObject({
        statusCode: 403,
        error: "insufficient_scope",
      });
    }
  });
});
