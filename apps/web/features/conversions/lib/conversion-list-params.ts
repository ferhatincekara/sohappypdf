import { APP_PATHS } from "@/features/app-shell";
import {
  CONVERSION_STATUSES,
  type ConversionStatus,
} from "../types/conversion";

export const CONVERSION_HISTORY_FILTERS = [
  "all",
  "queued",
  "processing",
  "completed",
  "failed",
] as const;

export type ConversionHistoryFilter =
  (typeof CONVERSION_HISTORY_FILTERS)[number];

export type ConversionListParams = {
  filter: ConversionHistoryFilter;
  status?: ConversionStatus;
  cursor?: string;
};

function isConversionStatus(value: string): value is ConversionStatus {
  return CONVERSION_STATUSES.some((status) => status === value);
}

function isHistoryFilter(value: string): value is ConversionHistoryFilter {
  return CONVERSION_HISTORY_FILTERS.some((filter) => filter === value);
}

export function parseConversionListSearchParams(
  searchParams: URLSearchParams,
): ConversionListParams {
  const statusValue = searchParams.get("status")?.trim();
  const cursor = searchParams.get("cursor")?.trim();
  const status =
    statusValue !== undefined && isConversionStatus(statusValue)
      ? statusValue
      : undefined;
  const filter: ConversionHistoryFilter =
    status !== undefined && isHistoryFilter(status) ? status : "all";

  return {
    filter,
    ...(status === undefined ? {} : { status }),
    ...(cursor === undefined || cursor.length === 0 ? {} : { cursor }),
  };
}

export function conversionListHref(params: {
  filter?: ConversionHistoryFilter;
  cursor?: string;
}): {
  pathname: string;
  query?: { status?: string; cursor?: string };
} {
  const filter = params.filter ?? "all";
  const query: { status?: string; cursor?: string } = {};

  if (filter !== "all") {
    query.status = filter;
  }

  if (params.cursor !== undefined && params.cursor.length > 0) {
    query.cursor = params.cursor;
  }

  if (query.status === undefined && query.cursor === undefined) {
    return { pathname: APP_PATHS.conversions };
  }

  return {
    pathname: APP_PATHS.conversions,
    query,
  };
}
