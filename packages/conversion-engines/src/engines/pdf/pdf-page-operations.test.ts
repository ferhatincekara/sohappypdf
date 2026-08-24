import { describe, expect, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { PermanentConversionError } from "../../errors.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import {
  cropPdfMargins,
  organizePdfPages,
  removePdfPages,
  reorderPdfPages,
  rotatePdfPages,
} from "./pdf-page-operations.js";

async function writeMultiPagePdf(path: string, pages: number): Promise<void> {
  const document = await PDFDocument.create();

  for (let index = 0; index < pages; index += 1) {
    document.addPage([240, 320]);
  }

  await writeFile(path, await document.save());
}

describe("pdf page operations", () => {
  test("reorders, removes, rotates, and crops pages", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440301",
    );

    try {
      const source = workspace.join("source.pdf");
      const reordered = workspace.join("reordered.pdf");
      const removed = workspace.join("removed.pdf");
      const rotated = workspace.join("rotated.pdf");
      const cropped = workspace.join("cropped.pdf");
      await writeMultiPagePdf(source, 3);

      await reorderPdfPages({
        sourcePath: source,
        outputPath: reordered,
        order: [3, 1, 2],
      });
      expect(
        (await PDFDocument.load(await readFile(reordered))).getPageCount(),
      ).toBe(3);

      await removePdfPages({
        sourcePath: source,
        outputPath: removed,
        pagesToRemove: [2],
      });
      expect(
        (await PDFDocument.load(await readFile(removed))).getPageCount(),
      ).toBe(2);

      await rotatePdfPages({
        sourcePath: source,
        outputPath: rotated,
        degrees: 90,
        pages: [1],
      });
      const rotatedDocument = await PDFDocument.load(await readFile(rotated));
      expect(rotatedDocument.getPageCount()).toBe(3);
      expect(rotatedDocument.getPage(0)?.getRotation().angle % 360).toBe(90);

      const organized = workspace.join("organized.pdf");
      await organizePdfPages({
        sourcePath: source,
        outputPath: organized,
        order: [3, 1],
        rotations: [90, 0],
      });
      const organizedDocument = await PDFDocument.load(
        await readFile(organized),
      );
      expect(organizedDocument.getPageCount()).toBe(2);
      expect(organizedDocument.getPage(0)?.getRotation().angle % 360).toBe(90);

      await cropPdfMargins({
        sourcePath: source,
        outputPath: cropped,
        marginTop: 10,
        marginRight: 10,
        marginBottom: 10,
        marginLeft: 10,
      });
      const croppedPage = (
        await PDFDocument.load(await readFile(cropped))
      ).getPage(0);
      const cropBox = croppedPage?.getCropBox();

      expect(cropBox?.width).toBe(220);
      expect(cropBox?.height).toBe(300);
    } finally {
      await workspace.cleanup();
    }
  });

  test("rejects invalid page selections", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440302",
    );

    try {
      const source = workspace.join("source.pdf");
      await writeMultiPagePdf(source, 2);

      await expect(
        reorderPdfPages({
          sourcePath: source,
          outputPath: workspace.join("bad.pdf"),
          order: [1, 1],
        }),
      ).rejects.toBeInstanceOf(PermanentConversionError);

      await expect(
        organizePdfPages({
          sourcePath: source,
          outputPath: workspace.join("empty-organize.pdf"),
          order: [],
        }),
      ).rejects.toBeInstanceOf(PermanentConversionError);

      const duplicated = workspace.join("duplicated.pdf");
      await organizePdfPages({
        sourcePath: source,
        outputPath: duplicated,
        order: [1, 1],
      });
      expect(
        (await PDFDocument.load(await readFile(duplicated))).getPageCount(),
      ).toBe(2);

      await expect(
        removePdfPages({
          sourcePath: source,
          outputPath: workspace.join("empty.pdf"),
          pagesToRemove: [1, 2],
        }),
      ).rejects.toBeInstanceOf(PermanentConversionError);
    } finally {
      await workspace.cleanup();
    }
  });
});
