import { readFile, writeFile } from "node:fs/promises";
import type { OrganizeRotation, RotationDegrees } from "@repo/conversions";
import { degrees, PDFDocument, type PDFPage } from "pdf-lib";
import { invalidInputError, PermanentConversionError } from "../../errors.js";

export async function loadPdfDocument(path: string): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(await readFile(path));
  } catch {
    throw invalidInputError();
  }
}

export async function savePdfDocument(
  document: PDFDocument,
  outputPath: string,
): Promise<void> {
  await writeFile(outputPath, await document.save());
}

function assertValidPageNumber(pageNumber: number, pageCount: number): void {
  if (pageNumber < 1 || pageNumber > pageCount) {
    throw new PermanentConversionError(
      "invalid_options",
      "Invalid conversion options",
    );
  }
}

export async function reorderPdfPages(input: {
  sourcePath: string;
  outputPath: string;
  order: readonly number[];
}): Promise<void> {
  const source = await loadPdfDocument(input.sourcePath);
  const pageCount = source.getPageCount();

  if (input.order.length !== pageCount) {
    throw new PermanentConversionError(
      "invalid_options",
      "Invalid conversion options",
    );
  }

  const seen = new Set<number>();

  for (const pageNumber of input.order) {
    if (seen.has(pageNumber)) {
      throw new PermanentConversionError(
        "invalid_options",
        "Invalid conversion options",
      );
    }

    seen.add(pageNumber);
  }

  const output = await PDFDocument.create();

  for (const pageNumber of input.order) {
    assertValidPageNumber(pageNumber, pageCount);
    const [page] = await output.copyPages(source, [pageNumber - 1]);

    if (page === undefined) {
      throw invalidInputError();
    }

    output.addPage(page);
  }

  await savePdfDocument(output, input.outputPath);
}

export async function organizePdfPages(input: {
  sourcePath: string;
  outputPath: string;
  order: readonly number[];
  rotations?: readonly OrganizeRotation[];
}): Promise<void> {
  const source = await loadPdfDocument(input.sourcePath);
  const pageCount = source.getPageCount();

  if (input.order.length < 1) {
    throw new PermanentConversionError(
      "invalid_options",
      "Invalid conversion options",
    );
  }

  if (
    input.rotations !== undefined &&
    input.rotations.length !== input.order.length
  ) {
    throw new PermanentConversionError(
      "invalid_options",
      "Invalid conversion options",
    );
  }

  const output = await PDFDocument.create();

  for (let index = 0; index < input.order.length; index += 1) {
    const pageNumber = input.order[index];

    if (pageNumber === undefined) {
      throw new PermanentConversionError(
        "invalid_options",
        "Invalid conversion options",
      );
    }

    assertValidPageNumber(pageNumber, pageCount);
    const [page] = await output.copyPages(source, [pageNumber - 1]);

    if (page === undefined) {
      throw invalidInputError();
    }

    output.addPage(page);
    const rotation = input.rotations?.[index] ?? 0;

    if (rotation !== 0) {
      applyRotation(page, rotation);
    }
  }

  await savePdfDocument(output, input.outputPath);
}

export async function removePdfPages(input: {
  sourcePath: string;
  outputPath: string;
  pagesToRemove: readonly number[];
}): Promise<void> {
  const source = await loadPdfDocument(input.sourcePath);
  const pageCount = source.getPageCount();
  const removeSet = new Set(input.pagesToRemove);

  for (const pageNumber of input.pagesToRemove) {
    assertValidPageNumber(pageNumber, pageCount);
  }

  const keepOrder: number[] = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    if (!removeSet.has(pageNumber)) {
      keepOrder.push(pageNumber);
    }
  }

  if (keepOrder.length === 0) {
    throw new PermanentConversionError(
      "invalid_options",
      "Invalid conversion options",
    );
  }

  const output = await PDFDocument.create();

  for (const pageNumber of keepOrder) {
    const [page] = await output.copyPages(source, [pageNumber - 1]);

    if (page === undefined) {
      throw invalidInputError();
    }

    output.addPage(page);
  }

  await savePdfDocument(output, input.outputPath);
}

export async function rotatePdfPages(input: {
  sourcePath: string;
  outputPath: string;
  degrees: RotationDegrees;
  pages?: readonly number[];
}): Promise<void> {
  const source = await loadPdfDocument(input.sourcePath);
  const pageCount = source.getPageCount();
  const targets =
    input.pages ?? Array.from({ length: pageCount }, (_, index) => index + 1);

  for (const pageNumber of targets) {
    assertValidPageNumber(pageNumber, pageCount);
  }

  const output = await PDFDocument.create();
  const copied = await output.copyPages(source, source.getPageIndices());

  for (let index = 0; index < copied.length; index += 1) {
    const page = copied[index];

    if (page === undefined) {
      throw invalidInputError();
    }

    output.addPage(page);
  }

  const targetSet = new Set(targets);

  for (let index = 0; index < output.getPageCount(); index += 1) {
    const pageNumber = index + 1;

    if (!targetSet.has(pageNumber)) {
      continue;
    }

    const page = output.getPage(index);

    if (page === undefined) {
      throw invalidInputError();
    }

    applyRotation(page, input.degrees);
  }

  await savePdfDocument(output, input.outputPath);
}

function applyRotation(
  page: PDFPage,
  rotation: Exclude<OrganizeRotation, 0>,
): void {
  const current = page.getRotation().angle;
  page.setRotation(degrees(current + rotation));
}

export async function cropPdfMargins(input: {
  sourcePath: string;
  outputPath: string;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
}): Promise<void> {
  const source = await loadPdfDocument(input.sourcePath);
  const output = await PDFDocument.create();
  const copied = await output.copyPages(source, source.getPageIndices());

  for (const page of copied) {
    if (page === undefined) {
      throw invalidInputError();
    }

    output.addPage(page);
  }

  for (let index = 0; index < output.getPageCount(); index += 1) {
    const page = output.getPage(index);

    if (page === undefined) {
      throw invalidInputError();
    }

    const { width, height } = page.getSize();
    const cropWidth = width - input.marginLeft - input.marginRight;
    const cropHeight = height - input.marginTop - input.marginBottom;

    if (cropWidth <= 0 || cropHeight <= 0) {
      throw new PermanentConversionError(
        "invalid_options",
        "Invalid conversion options",
      );
    }

    page.setCropBox(
      input.marginLeft,
      input.marginBottom,
      cropWidth,
      cropHeight,
    );
  }

  await savePdfDocument(output, input.outputPath);
}
