import { describe, expect, test } from "bun:test";
import {
  createConversionFormSchema,
  isConversionId,
  toCreateConversionInput,
} from "./create-conversion-schema";

const t = (key: string) => key;
const fileId = "11111111-1111-4111-8111-111111111111";

describe("create conversion schema", () => {
  test("accepts a unique supported conversion without a type", () => {
    const result = createConversionFormSchema(t, "pdf").safeParse({
      sourceFileId: fileId,
      targetFormat: "jpg",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(toCreateConversionInput(result.data, "pdf")).toEqual({
        sourceFileId: fileId,
        targetFormat: "jpg",
      });
    }
  });

  test("requires a type when multiple pdf-to-pdf conversions exist", () => {
    const missingType = createConversionFormSchema(t, "pdf").safeParse({
      sourceFileId: fileId,
      targetFormat: "pdf",
    });
    const withType = createConversionFormSchema(t, "pdf").safeParse({
      sourceFileId: fileId,
      targetFormat: "pdf",
      type: "compress-pdf",
    });

    expect(missingType.success).toBe(false);
    expect(withType.success).toBe(true);
    if (withType.success) {
      expect(toCreateConversionInput(withType.data, "pdf")).toEqual({
        sourceFileId: fileId,
        targetFormat: "pdf",
        type: "compress-pdf",
      });
    }
  });

  test("rejects an invalid conversion combination", () => {
    const result = createConversionFormSchema(t, "pdf").safeParse({
      sourceFileId: fileId,
      targetFormat: "xlsx",
    });

    expect(result.success).toBe(false);
  });

  test("rejects an invalid file id", () => {
    const result = createConversionFormSchema(t, "jpg").safeParse({
      sourceFileId: "not-a-file-id",
      targetFormat: "pdf",
    });

    expect(result.success).toBe(false);
    expect(isConversionId("not-a-file-id")).toBe(false);
    expect(isConversionId(fileId)).toBe(true);
  });
});
