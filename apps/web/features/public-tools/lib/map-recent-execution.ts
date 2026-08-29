import { findRegisteredTool } from "@sohappypdf/tools/catalog";
import {
  canDownloadConversion,
  isConversionExpired,
} from "@/features/conversions/lib/can-download-conversion";
import { isPublicConversionInProgressStale } from "@/features/conversions/lib/conversion-stale";
import type { PublicConversion } from "@/features/conversions/types/conversion";
import { deriveResultFilename } from "@/features/public-tools/lib/derive-result-filename";
import { RECENT_EXECUTIONS_FALLBACK_ROUTE } from "@/features/public-tools/lib/recent-executions";
import type { RecentExecution } from "@/features/public-tools/types/recent-execution";

export function resolveRecentToolRoute(toolId: string): `/${string}` {
  return findRegisteredTool(toolId)?.route ?? RECENT_EXECUTIONS_FALLBACK_ROUTE;
}

export function mapRecentExecution(
  conversion: PublicConversion,
  now: Date = new Date(),
): RecentExecution {
  const expired = isConversionExpired(conversion, now);
  const canDownload = canDownloadConversion(conversion, now);
  const timedOut = isPublicConversionInProgressStale(conversion, now);
  const processing =
    !timedOut &&
    (conversion.status === "pending" ||
      conversion.status === "queued" ||
      conversion.status === "processing");

  return {
    id: conversion.id,
    toolId: conversion.type,
    toolRoute: resolveRecentToolRoute(conversion.type),
    sourceFilename: conversion.sourceFilename,
    resultFilename: deriveResultFilename(
      conversion.sourceFilename,
      conversion.targetFormat,
    ),
    createdAt: conversion.createdAt,
    expiresAt: conversion.expiresAt,
    status: expired
      ? "expired"
      : processing
        ? "processing"
        : conversion.status === "completed" && !timedOut
          ? "ready"
          : "failed",
    canDownload,
    outputFileId: canDownload ? conversion.outputFileId : null,
  };
}
