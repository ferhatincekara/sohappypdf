import type { ConversionRecord } from "@repo/conversions";

export type PublicConversionError = {
  code: string;
  message: string;
};

export type PublicConversion = {
  id: string;
  status: ConversionRecord["status"];
  sourceFileId: string;
  outputFileId: string | null;
  type: ConversionRecord["type"];
  sourceFormat: ConversionRecord["sourceFormat"];
  targetFormat: ConversionRecord["targetFormat"];
  createdAt: string;
  updatedAt: string;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  error?: PublicConversionError;
};

export function toPublicConversion(
  conversion: ConversionRecord,
): PublicConversion {
  return {
    id: conversion.id,
    status: conversion.status,
    sourceFileId: conversion.sourceFileId,
    outputFileId: conversion.outputFileId,
    type: conversion.type,
    sourceFormat: conversion.sourceFormat,
    targetFormat: conversion.targetFormat,
    createdAt: conversion.createdAt.toISOString(),
    updatedAt: conversion.updatedAt.toISOString(),
    queuedAt: conversion.queuedAt?.toISOString() ?? null,
    startedAt: conversion.startedAt?.toISOString() ?? null,
    completedAt: conversion.completedAt?.toISOString() ?? null,
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
