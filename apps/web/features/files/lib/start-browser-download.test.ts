import { describe, expect, test } from "bun:test";
import { assertBrowserDownloadUrl } from "@/features/files/lib/start-browser-download";

describe("assertBrowserDownloadUrl", () => {
  test("accepts http and https download URLs", () => {
    expect(assertBrowserDownloadUrl("https://example.invalid/output.pdf")).toBe(
      "https://example.invalid/output.pdf",
    );
    expect(assertBrowserDownloadUrl("http://localhost:9000/output.pdf")).toBe(
      "http://localhost:9000/output.pdf",
    );
  });

  test("rejects non-http URLs", () => {
    expect(() => assertBrowserDownloadUrl("javascript:alert(1)")).toThrow(
      "Invalid download URL",
    );
  });
});
