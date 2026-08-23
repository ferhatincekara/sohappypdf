export const filesQueryKeys = {
  all: ["files"] as const,
  lists: () => [...filesQueryKeys.all, "list"] as const,
  list: (params: { cursor?: string } = {}) =>
    [...filesQueryKeys.lists(), params] as const,
};
