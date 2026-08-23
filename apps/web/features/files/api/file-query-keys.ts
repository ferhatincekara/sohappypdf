export const filesQueryKeys = {
  all: ["files"] as const,
  list: () => [...filesQueryKeys.all, "list"] as const,
};
