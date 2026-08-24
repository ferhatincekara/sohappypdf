export const publicToolQueryKeys = {
  all: ["public-tool"] as const,
  executions: () => [...publicToolQueryKeys.all, "execution"] as const,
  execution: (id: string, authenticated: boolean) =>
    [...publicToolQueryKeys.executions(), id, authenticated] as const,
};
