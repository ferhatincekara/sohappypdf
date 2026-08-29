import { describe, expect, test } from "bun:test";
import { buildZipArchive, uniqueZipEntryNames } from "./public-zip.js";

describe("zip archive", () => {
  test("disambiguates duplicate entry names", () => {
    expect(uniqueZipEntryNames(["a.pdf", "a.pdf", "b.pdf"])).toEqual([
      "a.pdf",
      "a-2.pdf",
      "b.pdf",
    ]);
  });

  test("writes a PK-prefixed store archive", () => {
    const archive = buildZipArchive([
      { name: "page-1.txt", data: new TextEncoder().encode("one") },
      { name: "page-2.txt", data: new TextEncoder().encode("two") },
    ]);

    expect(archive.subarray(0, 2)).toEqual(Uint8Array.from([80, 75]));
    expect(archive.byteLength).toBeGreaterThan(40);
  });
});
