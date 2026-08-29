import { describe, expect, test } from "bun:test";
import {
  MARKETING_SUPPORT_EMAIL,
  MARKETING_SUPPORT_MAILTO,
} from "@/features/marketing/lib/marketing-contact";

describe("marketing contact", () => {
  test("exposes a sohappypdf.com support mailbox", () => {
    expect(MARKETING_SUPPORT_EMAIL).toBe("hello@sohappypdf.com");
    expect(MARKETING_SUPPORT_MAILTO).toBe("mailto:hello@sohappypdf.com");
  });
});
