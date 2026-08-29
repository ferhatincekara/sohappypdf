import { describe, expect, test } from "bun:test";
import {
  exceedsPlanPageLimit,
  isPdfUploadFile,
  shouldHoldPdfForPageLimit,
} from "@/features/public-tools/lib/plan-page-limit";

describe("plan page limit", () => {
  test("detects PDF uploads by type or extension", () => {
    expect(
      isPdfUploadFile(new File(["a"], "doc.pdf", { type: "application/pdf" })),
    ).toBe(true);
    expect(isPdfUploadFile(new File(["a"], "doc.pdf", { type: "" }))).toBe(
      true,
    );
    expect(
      isPdfUploadFile(new File(["a"], "photo.jpg", { type: "image/jpeg" })),
    ).toBe(false);
  });

  test("compares page counts against a finite plan cap", () => {
    expect(exceedsPlanPageLimit(50, 50)).toBe(false);
    expect(exceedsPlanPageLimit(51, 50)).toBe(true);
    expect(exceedsPlanPageLimit(200, null)).toBe(false);
    expect(exceedsPlanPageLimit(200, undefined)).toBe(false);
  });

  test("holds PDFs until the plan page cap is known", () => {
    const pdf = new File(["a"], "doc.pdf", { type: "application/pdf" });
    const image = new File(["a"], "photo.jpg", { type: "image/jpeg" });

    expect(
      shouldHoldPdfForPageLimit({
        file: pdf,
        accessResolved: false,
        maxPagesPerFile: null,
      }),
    ).toBe(true);
    expect(
      shouldHoldPdfForPageLimit({
        file: pdf,
        accessResolved: true,
        maxPagesPerFile: 50,
      }),
    ).toBe(true);
    expect(
      shouldHoldPdfForPageLimit({
        file: pdf,
        accessResolved: true,
        maxPagesPerFile: null,
      }),
    ).toBe(false);
    expect(
      shouldHoldPdfForPageLimit({
        file: image,
        accessResolved: true,
        maxPagesPerFile: 50,
      }),
    ).toBe(false);
  });
});
