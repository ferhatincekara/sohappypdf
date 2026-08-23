import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import { toAttachmentContentDisposition } from "./content-disposition.js";

describe("toAttachmentContentDisposition", () => {
  test("uses an ASCII fallback and a UTF-8 filename parameter", () => {
    expect(toAttachmentContentDisposition("output.pdf")).toBe(
      "attachment; filename=\"output.pdf\"; filename*=UTF-8''output.pdf",
    );
    expect(toAttachmentContentDisposition("rapor özet.pdf")).toBe(
      "attachment; filename=\"rapor_zet.pdf\"; filename*=UTF-8''rapor%20%C3%B6zet.pdf",
    );
  });

  test("rejects filenames that would break the header", () => {
    try {
      toAttachmentContentDisposition("bad\nname.pdf");
      throw new Error("expected invalid filename to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
