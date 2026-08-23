export const conversionQueryKeys = {
  all: ["conversions"] as const,
  detail: (id: string) => [...conversionQueryKeys.all, "detail", id] as const,
};
