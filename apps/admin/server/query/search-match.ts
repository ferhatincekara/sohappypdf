export function matchesCatalogTool(
  tool: {
    id: string;
    route: string;
    category: string;
    processorId: string;
    nameKey: string;
  },
  needle: string,
): boolean {
  return (
    tool.id.includes(needle) ||
    tool.route.toLowerCase().includes(needle) ||
    tool.category.toLowerCase().includes(needle) ||
    tool.processorId.toLowerCase().includes(needle) ||
    tool.nameKey.toLowerCase().includes(needle)
  );
}
