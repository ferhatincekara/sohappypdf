import { readFile, stat } from "node:fs/promises";
import { joinJobPath } from "../../workspace/temp-workspace.js";
import {
  countLayoutWords,
  type LayoutPage,
  parsePdfLayout,
} from "../pdf/pdf-layout.js";
import type { LibreOfficeRunContext } from "./libreoffice-runner.js";

const MAX_LAYOUT_BYTES = 8 * 1024 * 1024;

export async function loadPdfLayoutPages(
  ctx: LibreOfficeRunContext,
  sourcePath: string,
  outputDirectory: string,
): Promise<LayoutPage[] | undefined> {
  const layoutPath = joinJobPath(outputDirectory, "layout.html");

  await ctx.runCommand({
    command: ctx.config.pdftotextBin,
    args: ["-bbox-layout", "-enc", "UTF-8", sourcePath, layoutPath],
    cwd: outputDirectory,
    timeoutMs: ctx.config.conversionTimeoutMs,
  });

  const layoutStat = await stat(layoutPath).catch(() => undefined);

  if (
    layoutStat === undefined ||
    layoutStat.size < 1 ||
    layoutStat.size > MAX_LAYOUT_BYTES
  ) {
    return undefined;
  }

  const layoutXml = await readFile(layoutPath, "utf8");

  if (layoutXml.length === 0) {
    return undefined;
  }

  const pages = parsePdfLayout(layoutXml);

  if (countLayoutWords(pages) === 0) {
    return undefined;
  }

  return pages;
}
