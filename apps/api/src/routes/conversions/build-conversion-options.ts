export function buildConversionRequestOptions(input: {
  additionalFileIds?: string[];
  options?: Record<string, unknown>;
}): Record<string, unknown> | undefined {
  const merged = {
    ...(input.options ?? {}),
    ...(input.additionalFileIds !== undefined &&
    input.additionalFileIds.length > 0
      ? { additionalFileIds: input.additionalFileIds }
      : {}),
  };

  return Object.keys(merged).length === 0 ? undefined : merged;
}
