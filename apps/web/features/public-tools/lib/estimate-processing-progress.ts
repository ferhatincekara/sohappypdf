import type { ToolProcessingStatus } from "@/features/public-tools/types/tool-ux-state";

function easeBetween(
  elapsedMs: number,
  floor: number,
  cap: number,
  tau: number,
): number {
  const elapsed = Math.max(0, elapsedMs);
  const t = 1 - Math.exp(-elapsed / tau);

  return Math.min(cap, Math.max(floor, Math.round(floor + t * (cap - floor))));
}

export function estimateProcessingPercent(
  status: ToolProcessingStatus,
  elapsedMs: number,
): number {
  if (status === "processing") {
    return easeBetween(elapsedMs, 32, 94, 2_800);
  }

  if (status === "queued") {
    return easeBetween(elapsedMs, 8, 32, 4_000);
  }

  return easeBetween(elapsedMs, 4, 16, 1_800);
}
