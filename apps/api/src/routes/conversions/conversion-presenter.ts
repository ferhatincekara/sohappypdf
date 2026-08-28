import {
  type ConversionRecord,
  isConversionRecordExpired,
} from "@repo/conversions";

export type PublicConversionError = {
  code: string;
  message: string;
};

export type PublicConversion = {
  id: string;
  status: ConversionRecord["status"];
  sourceFileId: string;
  sourceFilename: string | null;
  outputFileId: string | null;
  type: ConversionRecord["type"];
  sourceFormat: ConversionRecord["sourceFormat"];
  targetFormat: ConversionRecord["targetFormat"];
  createdAt: string;
  updatedAt: string;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  expired: boolean;
  error?: PublicConversionError;
};

function isExpired(conversion: ConversionRecord, now: Date): boolean {
  return isConversionRecordExpired(conversion, now);
}

export function toPublicConversion(
  conversion: ConversionRecord,
  extras?: { sourceFilename?: string | null; now?: Date },
): PublicConversion {
  const now = extras?.now ?? new Date();
  const expired = isExpired(conversion, now);

  return {
    id: conversion.id,
    status: conversion.status,
    sourceFileId: conversion.sourceFileId,
    sourceFilename: extras?.sourceFilename ?? null,
    outputFileId: expired ? null : conversion.outputFileId,
    type: conversion.type,
    sourceFormat: conversion.sourceFormat,
    targetFormat: conversion.targetFormat,
    createdAt: conversion.createdAt.toISOString(),
    updatedAt: conversion.updatedAt.toISOString(),
    queuedAt: conversion.queuedAt?.toISOString() ?? null,
    startedAt: conversion.startedAt?.toISOString() ?? null,
    completedAt: conversion.completedAt?.toISOString() ?? null,
    expiresAt: conversion.expiresAt?.toISOString() ?? null,
    expired,
    ...(conversion.errorCode === null || conversion.errorMessage === null
      ? {}
      : {
          error: {
            code: conversion.errorCode,
            message: conversion.errorMessage,
          },
        }),
  };
}
