export const apiKeysQueryKeys = {
  all: ["api-keys"] as const,
  lists: () => [...apiKeysQueryKeys.all, "list"] as const,
  list: () => [...apiKeysQueryKeys.lists()] as const,
};
