import { describe, expect, test } from "bun:test";
import { cn } from "./utils";

describe("cn", () => {
  test("merges class names", () => {
    expect(cn("px-2", false && "hidden", "px-4")).toBe("px-4");
  });
});
