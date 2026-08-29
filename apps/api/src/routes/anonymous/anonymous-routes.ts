import type { AnonymousConfig } from "@sohappypdf/config";
import type { ConversionService } from "@sohappypdf/conversions";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import type { FileService } from "@sohappypdf/files";
import type { ConversionJobData } from "@sohappypdf/queue";
import { type Context, Hono } from "hono";
import type { AppEnv } from "../../app-env.js";
import { requireAnonymousIdentity } from "../../auth/request-identity.js";
import { getClientIp } from "../../client-ip.js";
import {
  applyRateLimitHeaders,
  type CheckRateLimit,
} from "../../middleware/rate-limit.js";
import { toRateLimitSubject } from "../../rate-limit-subject.js";
import { buildConversionRequestOptions } from "../conversions/build-conversion-options.js";
import { toPublicConversion } from "../conversions/conversion-presenter.js";
import {
  parseConversionId,
  parseListConversionsQuery,
} from "../conversions/conversion-schemas.js";
import { enqueueCreatedConversion } from "../conversions/enqueue-created-conversion.js";
import {
  resolveSourceFilename,
  resolveSourceFilenames,
} from "../conversions/resolve-source-filenames.js";
import {
  toPublicFile,
  toUploadIntentResponse,
} from "../files/file-presenter.js";
import { createFileSchemas, readJsonBody } from "../files/file-schemas.js";
import {
  isJsonRecord,
  parseCreateAnonymousConversion,
  resolveAnonymousConversionRequest,
} from "./anonymous-schemas.js";

export type AnonymousRoutesOptions = {
  getFileService: () => FileService;
  getConversionService: () => ConversionService;
  enqueueConversion: (input: ConversionJobData) => Promise<unknown>;
  anonymousConfig: AnonymousConfig;
  checkAnonymousOperationRateLimit?: CheckRateLimit;
};

async function assertAnonymousOperationAllowed(
  c: Context<AppEnv>,
  check: CheckRateLimit | undefined,
): Promise<void> {
  if (check === undefined) {
    return;
  }

  const identity = requireAnonymousIdentity(c.get("identity"));
  const headers = new Headers();
  const decision = await check(
    toRateLimitSubject(identity, getClientIp(c.req.raw.headers)),
  );

  if (decision.failedOpen) {
    c.get("logger").warn("rate limit check failed open", {
      limiter: decision.kind,
    });
  }

  applyRateLimitHeaders(headers, decision, Date.now());

  for (const [name, value] of headers.entries()) {
    c.header(name, value);
  }

  if (!decision.allowed) {
    throw new AppError({
      code: APP_ERROR_CODES.RATE_LIMITED,
      message: "Too many requests",
    });
  }
}

export function createAnonymousRoutes(options: AnonymousRoutesOptions) {
  const anonymous = new Hono<AppEnv>();
  const schemas = createFileSchemas(options.anonymousConfig.maxFileSizeBytes);

  anonymous.post("/files/upload", async (c) => {
    const identity = requireAnonymousIdentity(c.get("identity"));
    const raw = await readJsonBody(c.req.raw);

    if (
      isJsonRecord(raw) &&
      typeof raw.size === "number" &&
      raw.size > options.anonymousConfig.maxFileSizeBytes
    ) {
      throw new AppError({
        code: APP_ERROR_CODES.FILE_TOO_LARGE,
        message: "File too large",
      });
    }

    const body = schemas.parseUploadIntent(raw);
    const result = await options.getFileService().createUploadIntent({
      ownerId: identity.sessionId,
      ownerKind: "anonymous_session",
      originalFilename: body.filename,
      mimeType: body.contentType,
      sizeBytes: body.size,
      expiresInMs: options.anonymousConfig.retentionMs,
    });

    c.get("logger").info("anonymous file upload intent created", {
      fileId: result.file.id,
    });

    return c.json(toUploadIntentResponse(result), 201);
  });

  anonymous.post("/files/:id/complete", async (c) => {
    const identity = requireAnonymousIdentity(c.get("identity"));
    const file = await options
      .getFileService()
      .completeUpload(
        schemas.parseFileId(c.req.param("id")),
        identity.sessionId,
      );

    c.get("logger").info("anonymous file upload completed", {
      fileId: file.id,
    });

    return c.json({ file: toPublicFile(file) });
  });

  anonymous.post("/files/archive", async (c) => {
    const identity = requireAnonymousIdentity(c.get("identity"));
    const body = schemas.parseArchiveRequest(await readJsonBody(c.req.raw));
    const download = await options
      .getFileService()
      .createOwnedArchiveDownloadUrl({
        ownerId: identity.sessionId,
        files: body.files,
        archiveName: body.archiveName,
      });

    c.get("logger").info("anonymous file archive download url created", {
      fileId: download.fileId,
      fileCount: body.files.length,
    });

    return c.json({
      download: {
        url: download.url,
        expiresInSeconds: download.expiresInSeconds,
      },
    });
  });

  anonymous.get("/files/:id", async (c) => {
    const identity = requireAnonymousIdentity(c.get("identity"));
    const file = await options
      .getFileService()
      .getOwnedFile(schemas.parseFileId(c.req.param("id")), identity.sessionId);

    return c.json({ file: toPublicFile(file) });
  });

  anonymous.post("/files/:id/download", async (c) => {
    const identity = requireAnonymousIdentity(c.get("identity"));
    const download = await options
      .getFileService()
      .createOwnedDownloadUrl(
        schemas.parseFileId(c.req.param("id")),
        identity.sessionId,
      );

    c.get("logger").info("anonymous file download url created", {
      fileId: download.fileId,
    });

    return c.json({
      download: {
        url: download.url,
        expiresInSeconds: download.expiresInSeconds,
      },
    });
  });

  anonymous.post("/conversions", async (c) => {
    const identity = requireAnonymousIdentity(c.get("identity"));
    await assertAnonymousOperationAllowed(
      c,
      options.checkAnonymousOperationRateLimit,
    );
    const body = parseCreateAnonymousConversion(await readJsonBody(c.req.raw));
    const resolved = resolveAnonymousConversionRequest(
      body,
      options.anonymousConfig,
    );
    const expiresAt = new Date(
      Date.now() + options.anonymousConfig.retentionMs,
    );
    const conversion = await enqueueCreatedConversion({
      conversions: options.getConversionService(),
      findFileById: (id) => options.getFileService().findFileById(id),
      enqueue: options.enqueueConversion,
      logger: c.get("logger"),
      input: {
        ownerId: identity.sessionId,
        ownerKind: "anonymous_session",
        sourceFileId: body.sourceFileId,
        targetFormat: resolved.targetFormat,
        type: resolved.type,
        expiresAt,
        options: buildConversionRequestOptions({
          additionalFileIds: resolved.additionalFileIds,
          options: resolved.options,
        }),
      },
    });

    c.get("logger").info("anonymous conversion created", {
      conversionId: conversion.id,
      sourceFileId: conversion.sourceFileId,
    });

    return c.json(
      {
        conversion: toPublicConversion(conversion, {
          sourceFilename:
            (
              await options
                .getFileService()
                .findFileById(conversion.sourceFileId)
            )?.originalFilename ?? null,
        }),
      },
      201,
    );
  });

  anonymous.get("/conversions", async (c) => {
    const identity = requireAnonymousIdentity(c.get("identity"));
    const query = parseListConversionsQuery(c.req.query());
    const result = await options.getConversionService().listOwnedConversions({
      ownerId: identity.sessionId,
      ownerKind: "anonymous_session",
      limit: query.limit,
      cursor: query.cursor,
      status: query.status,
      targetFormat: query.targetFormat,
    });
    const sourceFilenames = await resolveSourceFilenames(
      options.getFileService(),
      result.conversions.map((conversion) => conversion.sourceFileId),
    );

    return c.json({
      conversions: result.conversions.map((conversion) =>
        toPublicConversion(conversion, {
          sourceFilename: sourceFilenames.get(conversion.sourceFileId) ?? null,
        }),
      ),
      nextCursor: result.nextCursor,
    });
  });

  anonymous.get("/conversions/:id", async (c) => {
    const identity = requireAnonymousIdentity(c.get("identity"));
    const conversion = await options
      .getConversionService()
      .getOwnedConversion(
        parseConversionId(c.req.param("id")),
        identity.sessionId,
      );

    return c.json({
      conversion: toPublicConversion(conversion, {
        sourceFilename: await resolveSourceFilename(
          options.getFileService(),
          conversion.sourceFileId,
        ),
      }),
    });
  });

  return anonymous;
}
