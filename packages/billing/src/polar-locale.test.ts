import { describe, expect, test } from "bun:test";
import {
  resolvePolarCheckoutLocale,
  withPolarCheckoutLocale,
} from "./polar-locale.js";

describe("resolvePolarCheckoutLocale", () => {
  test("keeps Polar language tags and maps regional variants", () => {
    expect(resolvePolarCheckoutLocale("tr")).toBe("tr");
    expect(resolvePolarCheckoutLocale("en-US")).toBe("en");
    expect(resolvePolarCheckoutLocale("fr-CA")).toBe("fr");
    expect(resolvePolarCheckoutLocale("pt-BR")).toBe("pt");
    expect(resolvePolarCheckoutLocale("pt-PT")).toBe("pt-PT");
    expect(resolvePolarCheckoutLocale("zh")).toBeUndefined();
    expect(resolvePolarCheckoutLocale("")).toBeUndefined();
  });
});

describe("withPolarCheckoutLocale", () => {
  test("sets the Polar checkout locale query", () => {
    expect(
      withPolarCheckoutLocale("https://polar.sh/checkout/cs_1", "tr"),
    ).toBe("https://polar.sh/checkout/cs_1?locale=tr");
  });
});
