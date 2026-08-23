import type { FileService } from "@repo/files";
import { Hono } from "hono";
import type { AppEnv } from "../../app-env.js";
import { requireAuthenticatedIdentity } from "../../auth/request-identity.js";
import { requireAuthMiddleware } from "../../middleware/require-auth.js";
import { toPublicFile, toUploadIntentResponse } from "./file-presenter.js";
import { createFileSchemas, readJsonBody } from "./file-schemas.js";

export type FileRoutesOptions = {
  getFileService: () => FileService;
  maxUploadFileSizeBytes?: number;
};

export function createFileRoutes(options: FileRoutesOptions) {
  const files = new Hono<AppEnv>();
  const schemas = createFileSchemas(options.maxUploadFileSizeBytes);

  files.use("*", requireAuthMiddleware());

  files.post("/upload", async (c) => {
    const identity = requireAuthenticatedIdentity(c.get("identity"));
    const body = schemas.parseUploadIntent(await readJsonBody(c.req.raw));
    const result = await options.getFileService().createUploadIntent({
      ownerId: identity.userId,
      originalFilename: body.filename,
      mimeType: body.contentType,
      sizeBytes: body.size,
    });

    c.get("logger").info("file upload intent created", {
      fileId: result.file.id,
      userId: identity.userId,
    });

    return c.json(toUploadIntentResponse(result), 201);
  });

  files.get("/", async (c) => {
    const identity = requireAuthenticatedIdentity(c.get("identity"));
    const query = schemas.parseListQuery(c.req.query());
    const result = await options.getFileService().listOwnedFiles({
      ownerId: identity.userId,
      limit: query.limit,
      cursor: query.cursor,
    });

    return c.json({
      files: result.files.map((file) => toPublicFile(file)),
      nextCursor: result.nextCursor,
    });
  });

  files.get("/:id", async (c) => {
    const identity = requireAuthenticatedIdentity(c.get("identity"));
    const file = await options
      .getFileService()
      .getOwnedFile(schemas.parseFileId(c.req.param("id")), identity.userId);

    return c.json({ file: toPublicFile(file) });
  });

  files.post("/:id/download", async (c) => {
    const identity = requireAuthenticatedIdentity(c.get("identity"));
    const download = await options
      .getFileService()
      .createOwnedDownloadUrl(
        schemas.parseFileId(c.req.param("id")),
        identity.userId,
      );

    c.get("logger").info("file download url created", {
      fileId: download.fileId,
      userId: identity.userId,
    });

    return c.json({
      download: {
        url: download.url,
        expiresInSeconds: download.expiresInSeconds,
      },
    });
  });

  files.post("/:id/complete", async (c) => {
    const identity = requireAuthenticatedIdentity(c.get("identity"));
    const file = await options
      .getFileService()
      .completeUpload(schemas.parseFileId(c.req.param("id")), identity.userId);

    c.get("logger").info("file upload completed", {
      fileId: file.id,
      userId: identity.userId,
    });

    return c.json({ file: toPublicFile(file) });
  });

  files.delete("/:id", async (c) => {
    const identity = requireAuthenticatedIdentity(c.get("identity"));
    const file = await options
      .getFileService()
      .deleteOwnedFile(schemas.parseFileId(c.req.param("id")), identity.userId);

    c.get("logger").info("file deleted", {
      fileId: file.id,
      userId: identity.userId,
    });

    return c.json({ file: toPublicFile(file) });
  });

  return files;
}
