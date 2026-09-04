import { sql } from "drizzle-orm";

export function countInt(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function avgNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const ACTIVE_SUBSCRIPTION_SQL = sql`
  (
    status in ('active', 'trialing', 'past_due')
    or (
      status = 'canceled'
      and cancel_at_period_end = true
      and current_period_end is not null
      and current_period_end > now()
    )
  )
  and (ended_at is null or ended_at > now())
`;
