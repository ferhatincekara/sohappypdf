import type { BillingService } from "@repo/billing";
import type { ConversionService } from "@repo/conversions";
import type { FileService } from "@repo/files";
import type { ConversionJobData } from "@repo/queue";
import { Hono } from "hono";
import type { AppEnv } from "../../app-env.js";
import { requireAuthenticatedIdentity } from "../../auth/request-identity.js";
import { requireAuthMiddleware } from "../../middleware/require-auth.js";
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

export function createConversionRoutes(options: ConversionRoutesOptions) {
  const conversions = new Hono<AppEnv>();

  conversions.use("*", requireAuthMiddleware());

  conversions.post("/", async (c) => {
    const identity = requireAuthenticatedIdentity(c.get("identity"));
    const body = parseCreateConversion(await readJsonBody(c.req.raw));
    const idempotencyKey = parseIdempotencyKey(c.req.header("Idempotency-Key"));
    const existing =
      idempotencyKey === undefined
        ? undefined
        : await options
            .getConversionService()
            .findOwnedByIdempotencyKey(identity.userId, idempotencyKey);

    if (existing === undefined) {
      await options
        .getBillingService()
        .assertCanCreateConversion(identity.userId);
    }

    const conversion = await enqueueCreatedConversion({
      conversions: options.getConversionService(),
      findFileById: (id) => options.getFileService().findFileById(id),
      enqueue: options.enqueueConversion,
      logger: c.get("logger"),
      input: {
        ownerId: identity.userId,
        sourceFileId: body.sourceFileId,
        targetFormat: body.targetFormat,
        type: body.type,
        idempotencyKey,
      },
    });

    if (existing === undefined) {
      await options.getBillingService().recordConversionUsage({
        userId: identity.userId,
        conversionId: conversion.id,
      });
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
