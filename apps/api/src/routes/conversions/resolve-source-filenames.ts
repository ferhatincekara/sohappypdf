import type { FileService } from "@sohappypdf/files";

export async function resolveSourceFilename(
  files: FileService,
  sourceFileId: string,
): Promise<string | null> {
  const file = await files.findFileById(sourceFileId);
  return file?.originalFilename ?? null;
}

export async function resolveSourceFilenames(
  files: FileService,
  sourceFileIds: readonly string[],
): Promise<Map<string, string | null>> {
  const uniqueIds = [...new Set(sourceFileIds)];
  const resolved = await Promise.all(
    uniqueIds.map(async (id) => {
      const filename = await resolveSourceFilename(files, id);
      return [id, filename] as const;
    }),
  );

  return new Map(resolved);
}
