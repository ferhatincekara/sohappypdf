import type { BillingService } from "@repo/billing";
import { usesAiCredits } from "@repo/billing";
import { loadRetentionPolicy } from "@repo/config";
import type { ConversionService } from "@repo/conversions";
import {
  fileFormatFromMimeType,
  normalizeFileFormat,
  resolveImplementedConversionType,
} from "@repo/conversions";
import { APP_ERROR_CODES, AppError, isAppError } from "@repo/core";
import type { FileService } from "@repo/files";
import type { ConversionJobData } from "@repo/queue";
import { Hono } from "hono";
import type { AppEnv } from "../../app-env.js";
import { requireAuthenticatedIdentity } from "../../auth/request-identity.js";
import { requireAuthMiddleware } from "../../middleware/require-auth.js";
import { buildConversionRequestOptions } from "./build-conversion-options.js";
import { toPublicConversion } from "./conversion-presenter.js";
import {
  parseConversionId,
  parseCreateConversion,
  parseIdempotencyKey,
  parseListConversionsQuery,
  readJsonBody,
} from "./conversion-schemas.js";
import { enqueueCreatedConversion } from "./enqueue-created-conversion.js";

export type ConversionRoutesOptions = {
  getConversionService: () => ConversionService;
  getFileService: () => FileService;
  getBillingService: () => BillingService;
  enqueueConversion: (input: ConversionJobData) => Promise<unknown>;
};

async function resolveConversionToolId(input: {
  fileService: FileService;
  ownerId: string;
  sourceFileId: string;
  targetFormat: string;
  type?: string;
}): Promise<string> {
  const sourceFile = await input.fileService.findFileById(input.sourceFileId);

  if (
    sourceFile === undefined ||
    sourceFile.ownerId !== input.ownerId ||
    sourceFile.deletedAt !== null
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: "File not found",
    });
  }

  const sourceFormat = fileFormatFromMimeType(sourceFile.mimeType);

  if (sourceFormat === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Unsupported conversion",
    });
  }

  const targetFormat = normalizeFileFormat(input.targetFormat);

  if (targetFormat === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid target format",
    });
  }

  return resolveImplementedConversionType(
    sourceFormat,
    targetFormat,
    input.type,
  );
}

export function createConversionRoutes(options: ConversionRoutesOptions) {
  const conversions = new Hono<AppEnv>();

  conversions.use("*", requireAuthMiddleware());

  conversions.post("/", async (c) => {
    const identity = requireAuthenticatedIdentity(c.get("identity"));
    const body = parseCreateConversion(await readJsonBody(c.req.raw));
    const idempotencyKey = parseIdempotencyKey(c.req.header("Idempotency-Key"));
    const billing = options.getBillingService();
    const fileService = options.getFileService();
    const existing =
      idempotencyKey === undefined
        ? undefined
        : await options
            .getConversionService()
            .findOwnedByIdempotencyKey(identity.userId, idempotencyKey);

    let conversionToolId: string | undefined;

    if (existing === undefined) {
      conversionToolId = await resolveConversionToolId({
        fileService,
        ownerId: identity.userId,
        sourceFileId: body.sourceFileId,
        targetFormat: body.targetFormat,
        type: body.type,
      });
      if (usesAiCredits(conversionToolId)) {
        await billing.assertCanSpendAiCredits({
          userId: identity.userId,
          toolId: conversionToolId,
        });
      } else if (identity.kind === "session") {
        await billing.assertCanSpendWebCredits({
          userId: identity.userId,
          toolId: conversionToolId,
        });
      } else {
        await billing.assertCanSpendApiCredits({
          userId: identity.userId,
          toolId: conversionToolId,
        });
      }
    }

    const conversion = await enqueueCreatedConversion({
      conversions: options.getConversionService(),
      findFileById: (id) => fileService.findFileById(id),
      enqueue: options.enqueueConversion,
      logger: c.get("logger"),
      input: {
        ownerId: identity.userId,
        sourceFileId: body.sourceFileId,
        targetFormat: body.targetFormat,
        type: body.type,
        idempotencyKey,
        expiresAt: new Date(Date.now() + loadRetentionPolicy().authenticatedMs),
        options: buildConversionRequestOptions({
          additionalFileIds: body.additionalFileIds,
          options: body.options,
        }),
      },
    });

    if (existing === undefined) {
      const toolId = conversionToolId ?? conversion.type;
      try {
        if (usesAiCredits(toolId)) {
          await billing.consumeAiCredits({
            userId: identity.userId,
            conversionId: conversion.id,
            toolId,
          });
        } else if (identity.kind === "session") {
          await billing.consumeWebCredits({
            userId: identity.userId,
            conversionId: conversion.id,
            toolId,
          });
        } else {
          await billing.consumeApiCredits({
            userId: identity.userId,
            conversionId: conversion.id,
            toolId,
          });
        }
      } catch (error) {
        if (
          isAppError(error) &&
          error.code === APP_ERROR_CODES.PLAN_LIMIT_REACHED
        ) {
          try {
            await options
              .getConversionService()
              .cancelOwnedConversion(conversion.id, identity.userId);
          } catch {
            c.get("logger").error("conversion cancelled after credit failure", {
              conversionId: conversion.id,
              userId: identity.userId,
            });
          }
        }

        throw error;
      }
    }

    c.get("logger").info("conversion created", {
      conversionId: conversion.id,
      sourceFileId: conversion.sourceFileId,
      userId: identity.userId,
      targetFormat: conversion.targetFormat,
    });

    return c.json(
      {
        conversion: toPublicConversion(conversion, {
          sourceFilename: await resolveSourceFilename(
            options.getFileService(),
            conversion.sourceFileId,
          ),
        }),
      },
      201,
    );
  });

  conversions.get("/", async (c) => {
    const identity = requireAuthenticatedIdentity(c.get("identity"));
    const query = parseListConversionsQuery(c.req.query());
    const result = await options.getConversionService().listOwnedConversions({
      ownerId: identity.userId,
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

  conversions.get("/:id", async (c) => {
    const identity = requireAuthenticatedIdentity(c.get("identity"));
    const conversion = await options
      .getConversionService()
      .getOwnedConversion(
        parseConversionId(c.req.param("id")),
        identity.userId,
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

  conversions.post("/:id/cancel", async (c) => {
    const identity = requireAuthenticatedIdentity(c.get("identity"));
    const conversion = await options
      .getConversionService()
      .cancelOwnedConversion(
        parseConversionId(c.req.param("id")),
        identity.userId,
      );

    c.get("logger").info("conversion cancelled", {
      conversionId: conversion.id,
      userId: identity.userId,
    });

    return c.json({
      conversion: toPublicConversion(conversion, {
        sourceFilename: await resolveSourceFilename(
          options.getFileService(),
          conversion.sourceFileId,
        ),
      }),
    });
  });

  return conversions;
}

async function resolveSourceFilename(
  files: FileService,
  sourceFileId: string,
): Promise<string | null> {
  const file = await files.findFileById(sourceFileId);
  return file?.originalFilename ?? null;
}

async function resolveSourceFilenames(
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
