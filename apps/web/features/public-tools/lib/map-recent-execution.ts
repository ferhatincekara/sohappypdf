import { findRegisteredTool } from "@repo/tools/catalog";
import {
  canDownloadConversion,
  isConversionExpired,
} from "@/features/conversions/lib/can-download-conversion";
import type { PublicConversion } from "@/features/conversions/types/conversion";
import type { RecentExecution } from "../types/recent-execution";
import { RECENT_EXECUTIONS_FALLBACK_ROUTE } from "./recent-executions";

export function resolveRecentToolRoute(toolId: string): `/${string}` {
  return findRegisteredTool(toolId)?.route ?? RECENT_EXECUTIONS_FALLBACK_ROUTE;
}

export function mapRecentExecution(
  conversion: PublicConversion,
  now: Date = new Date(),
): RecentExecution {
  const expired = isConversionExpired(conversion, now);
  const canDownload = canDownloadConversion(conversion, now);
  const processing =
    conversion.status === "pending" ||
    conversion.status === "queued" ||
    conversion.status === "processing";

  return {
    id: conversion.id,
    toolId: conversion.type,
    toolRoute: resolveRecentToolRoute(conversion.type),
    sourceFilename: conversion.sourceFilename,
    createdAt: conversion.createdAt,
    expiresAt: conversion.expiresAt,
    status: expired
      ? "expired"
      : processing
        ? "processing"
        : conversion.status === "completed"
          ? "completed"
          : "failed",
    canDownload,
    outputFileId: canDownload ? conversion.outputFileId : null,
  };
}
