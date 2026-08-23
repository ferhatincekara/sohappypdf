export const billingQueryKeys = {
  all: ["billing"] as const,
  status: () => [...billingQueryKeys.all, "status"] as const,
};
