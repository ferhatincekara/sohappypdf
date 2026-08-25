import { describe, expect, test } from "bun:test";
import { isAdminAllowlisted, loadAdminConfig } from "./admin-config.js";

describe("loadAdminConfig", () => {
  test("fails closed when no admins are configured", () => {
    const config = loadAdminConfig({});

    expect(config.userIds).toEqual([]);
    expect(config.emails).toEqual([]);
    expect(
      isAdminAllowlisted(
        { userId: "user_1", email: "owner@example.com" },
        config,
      ),
    ).toBe(false);
  });

  test("matches configured user ids and emails without case-sensitive email drift", () => {
    const config = loadAdminConfig({
      ADMIN_USER_IDS: "user_1, user_2",
      ADMIN_EMAILS: "Ops@Example.com, other@example.com",
    });

    expect(config.userIds).toEqual(["user_1", "user_2"]);
    expect(config.emails).toEqual(["ops@example.com", "other@example.com"]);
    expect(
      isAdminAllowlisted({ userId: "user_1", email: "a@example.com" }, config),
    ).toBe(true);
    expect(
      isAdminAllowlisted(
        { userId: "user_9", email: "OPS@example.com" },
        config,
      ),
    ).toBe(true);
    expect(
      isAdminAllowlisted(
        { userId: "user_9", email: "nobody@example.com" },
        config,
      ),
    ).toBe(false);
  });
});
