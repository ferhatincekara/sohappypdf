export const DEVELOPER_TOC_IDS = [
  "quickstart",
  "auth",
  "files",
  "conversions",
  "tools",
  "errors",
  "limits",
] as const;

export type DeveloperTocId = (typeof DEVELOPER_TOC_IDS)[number];

export const DEVELOPER_TOC_OFFSET_PX = 112;

export type DeveloperTocSection = {
  id: string;
  top: number;
};

export function resolveActiveTocId(
  sections: readonly DeveloperTocSection[],
  offset: number = DEVELOPER_TOC_OFFSET_PX,
): string | undefined {
  const first = sections[0];

  if (first === undefined) {
    return undefined;
  }

  let activeId = first.id;

  for (const section of sections) {
    if (section.top <= offset) {
      activeId = section.id;
    }
  }

  return activeId;
}
