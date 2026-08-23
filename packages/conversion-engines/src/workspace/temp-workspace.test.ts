import { describe, expect, test } from "bun:test";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { isAppError } from "@repo/core";
import {
  assertPathInside,
  createConversionWorkspace,
  createJobTempDirectory,
  joinJobPath,
  removeJobTempDirectory,
} from "./temp-workspace.js";

describe("conversion workspace", () => {
  test("creates a unique directory and removes it after use", async () => {
    const conversionId = "550e8400-e29b-41d4-a716-446655440123";
    const first = await createJobTempDirectory(conversionId);
    const second = await createJobTempDirectory(conversionId);

    expect(first).not.toBe(second);
    await access(first);
    await removeJobTempDirectory(first);
    await removeJobTempDirectory(second);

    try {
      await access(first);
      throw new Error("expected directory to be removed");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  test("rejects path traversal and user-controlled segments", () => {
    const root = "/tmp/sohappypdf-worker";

    try {
      assertPathInside(root, join(root, "..", "etc", "passwd"));
      throw new Error("expected path check to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }

    try {
      joinJobPath(root, "..", "passwd");
      throw new Error("expected join to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }

    try {
      joinJobPath(root, "report.pdf; rm -rf /");
      throw new Error("expected unsafe filename to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });

  test("cleans up through the workspace helper after failure", async () => {
    const workspace = await createConversionWorkspace(
      "550e8400-e29b-41d4-a716-446655440124",
    );

    try {
      expect(workspace.join("input.pdf").endsWith("input.pdf")).toBe(true);
    } finally {
      await workspace.cleanup();
    }

    try {
      await access(workspace.directory);
      throw new Error("expected workspace to be removed");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
