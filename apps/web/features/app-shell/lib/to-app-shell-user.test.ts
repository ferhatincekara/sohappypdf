import { describe, expect, test } from "bun:test";
import { gravatarUrl } from "@/features/app-shell/lib/gravatar-url";
import { toAppShellUser } from "@/features/app-shell/lib/to-app-shell-user";

describe("toAppShellUser", () => {
  test("uses the Better Auth image when it is present", () => {
    expect(
      toAppShellUser({
        name: "Ada",
        email: "ada@example.com",
        image: "https://cdn.example/ada.png",
      }).imageUrl,
    ).toBe("https://cdn.example/ada.png");
  });

  test("falls back to Gravatar when the Better Auth image is empty", () => {
    expect(
      toAppShellUser({
        name: "Ada",
        email: "ada@example.com",
        image: "  ",
      }).imageUrl,
    ).toBe(gravatarUrl("ada@example.com"));
  });
});
