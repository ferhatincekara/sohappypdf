import { describe, expect, test } from "bun:test";
import { gravatarUrl, resolveAvatarUrl } from "./gravatar-url.ts";

describe("admin gravatar", () => {
  test("hashes a trimmed lowercase email with SHA-256", () => {
    expect(gravatarUrl("  Ada@Example.com  ")).toBe(
      "https://www.gravatar.com/avatar/b5fc85e55755f9e0d030a10ab4429b6b2944855f9a0d60077fe832becbc41d72?s=96&d=404",
    );
  });

  test("prefers a stored image over Gravatar", () => {
    expect(
      resolveAvatarUrl("ada@example.com", "https://cdn.example/a.png"),
    ).toBe("https://cdn.example/a.png");
  });

  test("falls back to Gravatar when the stored image is empty", () => {
    expect(resolveAvatarUrl("ada@example.com", "  ")).toBe(
      gravatarUrl("ada@example.com"),
    );
  });
});
