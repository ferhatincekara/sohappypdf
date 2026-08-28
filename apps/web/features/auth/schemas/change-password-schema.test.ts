import { describe, expect, test } from "bun:test";
import { createChangePasswordSchema } from "./change-password-schema";

const t = (key: string) => key;

describe("createChangePasswordSchema", () => {
  test("requires the current password and matching new passwords", () => {
    const schema = createChangePasswordSchema(t);

    expect(
      schema.safeParse({
        currentPassword: "",
        password: "password1234",
        confirmPassword: "password1234",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        currentPassword: "old-password",
        password: "password1234",
        confirmPassword: "mismatch",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        currentPassword: "old-password",
        password: "password1234",
        confirmPassword: "password1234",
      }).success,
    ).toBe(true);
  });
});
