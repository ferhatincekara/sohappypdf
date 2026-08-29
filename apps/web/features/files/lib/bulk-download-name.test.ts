import { describe, expect, test } from "bun:test";
import {
  bulkDownloadArchiveName,
  bulkDownloadEntryName,
  stemFromFilename,
} from "@/features/files/lib/bulk-download-name";

describe("bulk download names", () => {
  test("strips the source extension and unsafe characters", () => {
    expect(stemFromFilename("report.pdf")).toBe("report");
    expect(stemFromFilename("a/b:c.pdf")).toBe("a-b-c");
    expect(stemFromFilename(null)).toBe("file");
  });

  test("builds numbered entry names for a zip", () => {
    expect(
      bulkDownloadEntryName({
        sourceFilename: "report.pdf",
        targetFormat: "jpg",
        index: 0,
      }),
    ).toBe("report.jpg");
    expect(
      bulkDownloadEntryName({
        sourceFilename: "report.pdf",
        targetFormat: "jpg",
        index: 1,
      }),
    ).toBe("report-2.jpg");
  });

  test("names a batch archive after the tool and file count", () => {
    expect(bulkDownloadArchiveName({ toolId: "pdf-to-word", count: 3 })).toBe(
      "pdf-to-word-3-files.zip",
    );
  });
});
