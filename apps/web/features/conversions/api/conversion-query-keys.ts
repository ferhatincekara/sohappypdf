export const conversionQueryKeys = {
  all: ["conversions"] as const,
  lists: () => [...conversionQueryKeys.all, "list"] as const,
  list: (params: { cursor?: string; status?: string } = {}) =>
    [...conversionQueryKeys.lists(), params] as const,
  detail: (id: string) => [...conversionQueryKeys.all, "detail", id] as const,
};
