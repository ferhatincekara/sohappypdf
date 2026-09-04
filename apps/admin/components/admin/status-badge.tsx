import { Badge } from "@/components/ui/badge";

const STATUS_VARIANTS = {
  healthy: "success",
  success: "success",
  completed: "success",
  active: "success",
  available: "success",
  warning: "warning",
  queued: "warning",
  processing: "warning",
  pending: "warning",
  trialing: "warning",
  past_due: "warning",
  degraded: "warning",
  failed: "destructive",
  failure: "destructive",
  cancelled: "muted",
  canceled: "muted",
  offline: "destructive",
  unavailable: "destructive",
  suspended: "destructive",
  revoked: "destructive",
  expired: "muted",
  inactive: "muted",
  free: "muted",
  pro: "success",
  admin: "default",
} as const;

type StatusTone = keyof typeof STATUS_VARIANTS;

export function StatusBadge({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const tone = value.toLowerCase().replaceAll(" ", "_") as StatusTone;
  const variant = STATUS_VARIANTS[tone] ?? "default";

  return <Badge variant={variant}>{label ?? value}</Badge>;
}
