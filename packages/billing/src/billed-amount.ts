export function monthlyUsdFromBilledAmount(input: {
  amountCents: number | null | undefined;
  recurringInterval: string | null | undefined;
}): number {
  return monthlyCentsFromBilledAmount(input) / 100;
}

export function monthlyCentsFromBilledAmount(input: {
  amountCents: number | null | undefined;
  recurringInterval: string | null | undefined;
}): number {
  if (
    input.amountCents === null ||
    input.amountCents === undefined ||
    input.amountCents <= 0
  ) {
    return 0;
  }

  if (input.recurringInterval === "year") {
    return Math.round(input.amountCents / 12);
  }

  if (input.recurringInterval === "week") {
    return Math.round((input.amountCents * 52) / 12);
  }

  if (input.recurringInterval === "day") {
    return Math.round((input.amountCents * 365) / 12);
  }

  return input.amountCents;
}

export function usesMonthlyWebCredits(monthlyWebCredits: number): boolean {
  return monthlyWebCredits > 0;
}
