import { describe, expect, test } from "bun:test";
import {
  resolvePolarCheckoutLocale,
  withPolarCheckoutLocale,
} from "./polar-locale.js";

describe("resolvePolarCheckoutLocale", () => {
  test("maps the site locale to a Polar checkout language", () => {
    expect(resolvePolarCheckoutLocale("tr")).toBe("tr");
    expect(resolvePolarCheckoutLocale("en")).toBe("en");
    expect(resolvePolarCheckoutLocale("en-US")).toBe("en");
    expect(resolvePolarCheckoutLocale("tr-TR")).toBe("tr");
    expect(resolvePolarCheckoutLocale("zh")).toBeUndefined();
  });
});

describe("withPolarCheckoutLocale", () => {
  test("adds Polar's locale query to the checkout URL", () => {
    expect(
      withPolarCheckoutLocale("https://polar.sh/checkout/cs_1", "tr"),
    ).toBe("https://polar.sh/checkout/cs_1?locale=tr");
  });
});
