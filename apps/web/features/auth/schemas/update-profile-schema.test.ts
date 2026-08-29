import { describe, expect, test } from "bun:test";
import { createUpdateProfileSchema } from "@/features/auth/schemas/update-profile-schema";

const t = (key: string) => key;

describe("createUpdateProfileSchema", () => {
  test("requires a name and a valid email", () => {
    const schema = createUpdateProfileSchema(t);

    expect(
      schema.safeParse({
        name: "",
        email: "ada@example.com",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        name: "Ada Lovelace",
        email: "not-an-email",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        name: "Ada Lovelace",
        email: "ada@example.com",
      }).success,
    ).toBe(true);
  });
});
