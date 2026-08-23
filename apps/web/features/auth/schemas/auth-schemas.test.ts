import { describe, expect, test } from "bun:test";
import { createForgotPasswordSchema } from "./forgot-password-schema";
import { createLoginSchema } from "./login-schema";
import { createRegisterSchema } from "./register-schema";
import { createResetPasswordSchema } from "./reset-password-schema";

const t = (key: string) => key;

describe("login schema", () => {
  test("accepts a valid email and password", () => {
    const result = createLoginSchema(t).safeParse({
      email: "ada@example.com",
      password: "password1234",
    });

    expect(result.success).toBe(true);
  });

  test("rejects an invalid email", () => {
    const result = createLoginSchema(t).safeParse({
      email: "not-an-email",
      password: "password1234",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain(
        "invalidEmail",
      );
    }
  });

  test("requires a password", () => {
    const result = createLoginSchema(t).safeParse({
      email: "ada@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("register schema", () => {
  test("accepts matching passwords that meet Better Auth limits", () => {
    const result = createRegisterSchema(t).safeParse({
      email: "ada@example.com",
      password: "password1234",
      confirmPassword: "password1234",
    });

    expect(result.success).toBe(true);
  });

  test("rejects a password shorter than 8 characters", () => {
    const result = createRegisterSchema(t).safeParse({
      email: "ada@example.com",
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        "passwordMin",
      );
    }
  });

  test("rejects a password confirmation mismatch", () => {
    const result = createRegisterSchema(t).safeParse({
      email: "ada@example.com",
      password: "password1234",
      confirmPassword: "password5678",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain(
        "passwordMismatch",
      );
    }
  });
});

describe("forgot password schema", () => {
  test("requires a valid email", () => {
    expect(
      createForgotPasswordSchema(t).safeParse({ email: "ada@example.com" })
        .success,
    ).toBe(true);
    expect(
      createForgotPasswordSchema(t).safeParse({ email: "ada" }).success,
    ).toBe(false);
  });
});

describe("reset password schema", () => {
  test("rejects mismatched new passwords", () => {
    const result = createResetPasswordSchema(t).safeParse({
      password: "password1234",
      confirmPassword: "different123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain(
        "passwordMismatch",
      );
    }
  });
});
