import { describe, expect, test } from "bun:test";
import {
  expandHttpsSiteOrigins,
  httpsApexWwwOrigins,
  isAllowedHttpsSiteOrigin,
} from "./site-origins.js";

describe("https site origins", () => {
  test("pairs apex and www for the public site", () => {
    expect(httpsApexWwwOrigins("https://sohappypdf.com")).toEqual([
      "https://sohappypdf.com",
      "https://www.sohappypdf.com",
    ]);
    expect(httpsApexWwwOrigins("https://www.sohappypdf.com/login")).toEqual([
      "https://sohappypdf.com",
      "https://www.sohappypdf.com",
    ]);
  });

  test("does not invent www for localhost or the API host", () => {
    expect(httpsApexWwwOrigins("http://localhost:3000")).toEqual([
      "http://localhost:3000",
    ]);
    expect(httpsApexWwwOrigins("https://api.sohappypdf.com")).toEqual([
      "https://api.sohappypdf.com",
    ]);
  });

  test("treats www as allowed when only the apex is listed", () => {
    const allowed = new Set(["https://sohappypdf.com"]);

    expect(
      isAllowedHttpsSiteOrigin("https://www.sohappypdf.com", allowed),
    ).toBe(true);
    expect(isAllowedHttpsSiteOrigin("https://evil.example", allowed)).toBe(
      false,
    );
  });

  test("expands a mixed origin list without duplicates", () => {
    expect(
      expandHttpsSiteOrigins([
        "https://sohappypdf.com",
        "http://localhost:3000",
        "https://www.sohappypdf.com",
      ]),
    ).toEqual([
      "https://sohappypdf.com",
      "https://www.sohappypdf.com",
      "http://localhost:3000",
    ]);
  });
});
