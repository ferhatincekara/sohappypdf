import { describe, expect, test } from "bun:test";
import { gravatarUrl } from "@/features/app-shell/lib/gravatar-url";

describe("gravatarUrl", () => {
  test("hashes a trimmed lowercase email with SHA-256", () => {
    expect(gravatarUrl("  Ada@Example.com  ")).toBe(
      "https://www.gravatar.com/avatar/b5fc85e55755f9e0d030a10ab4429b6b2944855f9a0d60077fe832becbc41d72?s=96&d=404",
    );
  });
});
