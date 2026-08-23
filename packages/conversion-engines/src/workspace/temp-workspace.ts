import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { APP_ERROR_CODES, AppError } from "@repo/core";

const TEMP_ROOT_NAME = "sohappypdf-worker";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ConversionWorkspace = {
  directory: string;
  join(...segments: string[]): string;
  cleanup(): Promise<void>;
};

export function getWorkerTempRoot(): string {
  return join(tmpdir(), TEMP_ROOT_NAME);
}

export function assertPathInside(root: string, target: string): string {
  const resolvedRoot = resolve(root);
  const resolvedTarget = resolve(target);

  if (!isAbsolute(resolvedRoot) || !isAbsolute(resolvedTarget)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid temporary path",
    });
  }

  const relation = relative(resolvedRoot, resolvedTarget);

  if (
    relation === "" ||
    (!relation.startsWith("..") && !isAbsolute(relation))
  ) {
    return resolvedTarget;
  }

  throw new AppError({
    code: APP_ERROR_CODES.VALIDATION_ERROR,
    message: "Invalid temporary path",
  });
}

export async function createJobTempDirectory(
  conversionId: string,
): Promise<string> {
  if (!UUID_PATTERN.test(conversionId)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid conversion id",
    });
  }

  const root = getWorkerTempRoot();
  await mkdir(root, { recursive: true });
  const directory = join(root, `${conversionId}-${randomUUID()}`);
  await mkdir(directory, { recursive: false });
  return directory;
}

export async function removeJobTempDirectory(directory: string): Promise<void> {
  const root = getWorkerTempRoot();
  const safeDirectory = assertPathInside(root, directory);
  await rm(safeDirectory, { recursive: true, force: true });
}

export function joinJobPath(directory: string, ...segments: string[]): string {
  for (const segment of segments) {
    if (
      segment.length === 0 ||
      segment.includes("/") ||
      segment.includes("\\") ||
      segment.includes("..") ||
      segment === "."
    ) {
      throw new AppError({
        code: APP_ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid temporary path",
      });
    }
  }

  return assertPathInside(directory, join(directory, ...segments));
}

export async function createConversionWorkspace(
  conversionId: string,
): Promise<ConversionWorkspace> {
  const directory = await createJobTempDirectory(conversionId);

  return {
    directory,
    join(...segments: string[]) {
      return joinJobPath(directory, ...segments);
    },
    async cleanup() {
      await removeJobTempDirectory(directory);
    },
  };
}
