import { describe, expect, test } from "bun:test";
import { createApiKeyFormSchema } from "@/features/api-keys/schemas/create-api-key-schema";

const schema = createApiKeyFormSchema((key) => key);

describe("create API key schema", () => {
  test("accepts a trimmed meaningful name", () => {
    expect(schema.parse({ name: "  Production  " })).toEqual({
      name: "Production",
    });
  });

  test("rejects empty, oversized, and control-character names", () => {
    expect(schema.safeParse({ name: "   " }).success).toBe(false);
    expect(schema.safeParse({ name: "a".repeat(81) }).success).toBe(false);
    expect(schema.safeParse({ name: "CI\nkey" }).success).toBe(false);
  });
});
