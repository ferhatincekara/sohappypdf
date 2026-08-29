import { writeFile } from "node:fs/promises";
import { buildZipArchive, type ZipArchiveEntry } from "@repo/utils/zip";

export type { ZipArchiveEntry };

export async function writeZipArchive(
  outputPath: string,
  files: readonly ZipArchiveEntry[],
): Promise<void> {
  await writeFile(outputPath, buildZipArchive(files));
}
