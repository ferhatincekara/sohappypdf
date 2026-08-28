import { describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "../../engine-config.js";
import type { RunCommandInput } from "../../process/run-process.js";
import { createConversionWorkspace } from "../../workspace/temp-workspace.js";
import { createOcrEngine } from "../ocr/ocr-engine.js";

describe("ocr engine", () => {
  test("runs ocrmypdf and returns a searchable PDF", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440301",
    );
    const calls: RunCommandInput[] = [];

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeFile(sourcePath, "%PDF-1.4\n");
      const engine = createOcrEngine(DEFAULT_CONVERSION_ENGINE_CONFIG, {
        isBinaryAvailable: () => true,
        async runCommand(input) {
          calls.push(input);
          const outputPath = input.args[input.args.length - 1];
          if (outputPath !== undefined) {
            await writeFile(outputPath, "%PDF-1.4\n%EOF\n");
          }
        },
      });

      const result = await engine.convert({
        type: "ocr-pdf",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: { type: "ocr-pdf", language: "eng", outputMode: "pdf" },
        additionalSourcePaths: [],
      });

      expect(calls[0]?.command).toBe("ocrmypdf");
      expect(calls[0]?.args).toContain("--skip-text");
      expect(result.filename).toBe("output.pdf");
    } finally {
      await workspace.cleanup();
    }
  });
});

describe("pdf edit overlays", () => {
  test("adds text overlays for edit-pdf", async () => {
    const { createPdfEditEngine } = await import("../pdf/pdf-edit-engine.js");
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440303",
    );

    try {
      const sourcePath = workspace.join("source.pdf");
      const document = await PDFDocument.create();
      const page = document.addPage([400, 400]);
      const font = await document.embedFont(StandardFonts.Helvetica);
      page.drawText("base", { x: 40, y: 350, size: 12, font });
      await writeFile(sourcePath, await document.save());

      const result = await createPdfEditEngine(
        DEFAULT_CONVERSION_ENGINE_CONFIG,
      ).convert({
        type: "edit-pdf",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: {
          type: "edit-pdf",
          operations: [
            { kind: "text", page: 1, x: 40, y: 200, text: "overlay", size: 14 },
            {
              kind: "rectangle",
              page: 1,
              x: 40,
              y: 100,
              width: 80,
              height: 20,
              style: "highlight",
            },
          ],
        },
        additionalSourcePaths: [],
      });

      expect(result.filename).toBe("output.pdf");
    } finally {
      await workspace.cleanup();
    }
  });
});

describe("pdf compare engine", () => {
  test("writes a unified text diff", async () => {
    const { createPdfCompareEngine } = await import(
      "../pdf/pdf-compare-engine.js"
    );
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440304",
    );
    const calls: RunCommandInput[] = [];

    try {
      const sourcePath = workspace.join("left.pdf");
      const otherPath = workspace.join("right.pdf");
      await writeFile(sourcePath, "%PDF-1.4\n");
      await writeFile(otherPath, "%PDF-1.4\n");

      const result = await createPdfCompareEngine(
        DEFAULT_CONVERSION_ENGINE_CONFIG,
        {
          async runCommand(input) {
            calls.push(input);
            const outputPath = input.args[input.args.length - 1];
            if (outputPath?.endsWith("left.txt")) {
              await writeFile(outputPath, "alpha\nshared\n");
            } else if (outputPath?.endsWith("right.txt")) {
              await writeFile(outputPath, "bravo\nshared\n");
            }
          },
        },
      ).convert({
        type: "compare-pdf",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "txt",
        options: {
          type: "compare-pdf",
          additionalFileIds: ["11111111-1111-4111-8111-111111111111"],
        },
        additionalSourcePaths: [otherPath],
      });

      expect(calls).toHaveLength(2);
      const diff = await Bun.file(result.outputPath).text();
      expect(diff).toContain("-alpha");
      expect(diff).toContain("+bravo");
      expect(diff).toContain(" shared");
    } finally {
      await workspace.cleanup();
    }
  });
});

describe("pdf markdown engine", () => {
  test("converts layout sections to markdown", async () => {
    const { createPdfMarkdownEngine } = await import(
      "../pdf/pdf-markdown-engine.js"
    );
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440305",
    );

    const layout = `<doc>
  <page width="612" height="792">
    <block xMin="200" yMin="100" xMax="400" yMax="130">
      <line xMin="200" yMin="100" xMax="400" yMax="130">
        <word xMin="200" yMin="100" xMax="400" yMax="130">Title</word>
      </line>
    </block>
    <block xMin="80" yMin="200" xMax="400" yMax="220">
      <line xMin="80" yMin="200" xMax="400" yMax="220">
        <word xMin="80" yMin="200" xMax="400" yMax="220">Hello</word>
      </line>
    </block>
  </page>
</doc>`;

    try {
      const sourcePath = workspace.join("source.pdf");
      await writeFile(sourcePath, "%PDF-1.4\n");
      const result = await createPdfMarkdownEngine(
        DEFAULT_CONVERSION_ENGINE_CONFIG,
        {
          async runCommand(input) {
            const outputPath = input.args[input.args.length - 1];
            if (outputPath !== undefined) {
              await writeFile(outputPath, layout);
            }
          },
        },
      ).convert({
        type: "pdf-to-markdown",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "md",
        options: { type: "pdf-to-markdown" },
        additionalSourcePaths: [],
      });

      const markdown = await Bun.file(result.outputPath).text();
      expect(markdown).toContain("Title");
      expect(markdown).toContain("Hello");
    } finally {
      await workspace.cleanup();
    }
  });
});

describe("pdf redact engine", () => {
  test("rasterizes pages then paints black regions", async () => {
    const { createPdfRedactEngine } = await import(
      "../pdf/pdf-redact-engine.js"
    );
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440306",
    );

    try {
      const sourcePath = workspace.join("source.pdf");
      const document = await PDFDocument.create();
      const page = document.addPage([200, 200]);
      const font = await document.embedFont(StandardFonts.Helvetica);
      page.drawText("SECRET", { x: 40, y: 100, size: 18, font });
      await writeFile(sourcePath, await document.save());

      // 1x1 PNG
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      );

      const result = await createPdfRedactEngine(
        DEFAULT_CONVERSION_ENGINE_CONFIG,
        {
          async runCommand(input) {
            const prefix = input.args[input.args.length - 1];
            if (prefix !== undefined) {
              await mkdir(workspace.join("raster"), { recursive: true });
              await writeFile(`${prefix}-1.png`, png);
            }
          },
        },
      ).convert({
        type: "redact-pdf",
        sourcePath,
        outputDirectory: workspace.directory,
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: {
          type: "redact-pdf",
          regions: [{ page: 1, x: 30, y: 90, width: 80, height: 30 }],
        },
        additionalSourcePaths: [],
      });

      expect(result.filename).toBe("output.pdf");
    } finally {
      await workspace.cleanup();
    }
  });
});
