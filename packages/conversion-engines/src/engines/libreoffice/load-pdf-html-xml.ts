import { access, readFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import { joinJobPath } from "../../workspace/temp-workspace.js";
import {
  countHtmlXmlTextChars,
  type HtmlXmlPage,
  parsePdftohtmlXml,
  safeHtmlXmlImageSrc,
} from "../pdf/pdftohtml-xml.js";
import type { LibreOfficeRunContext } from "./libreoffice-runner.js";

const MAX_LAYOUT_BYTES = 8 * 1024 * 1024;

export type PdfHtmlXmlDocument = {
  pages: HtmlXmlPage[];
  allowedImages: ReadonlySet<string>;
};

export async function loadPdfHtmlXml(
  ctx: LibreOfficeRunContext,
  sourcePath: string,
  outputDirectory: string,
): Promise<PdfHtmlXmlDocument | undefined> {
  const prefix = joinJobPath(outputDirectory, "word-layout");

  try {
    await ctx.runCommand({
      command: ctx.config.pdftohtmlBin,
      args: [
        "-xml",
        "-zoom",
        "1",
        "-enc",
        "UTF-8",
        "-nodrm",
        "-fontfullname",
        sourcePath,
        prefix,
      ],
      cwd: outputDirectory,
      timeoutMs: ctx.config.conversionTimeoutMs,
    });
  } catch {
    return undefined;
  }

  const xmlPath = `${prefix}.xml`;
  const xmlStat = await stat(xmlPath).catch(() => undefined);

  if (
    xmlStat === undefined ||
    xmlStat.size < 1 ||
    xmlStat.size > MAX_LAYOUT_BYTES
  ) {
    return undefined;
  }

  const xml = await readFile(xmlPath, "utf8");

  if (xml.length === 0) {
    return undefined;
  }

  const pages = parsePdftohtmlXml(xml);

  if (
    countHtmlXmlTextChars(pages) === 0 &&
    pages.every((page) => page.images.length === 0)
  ) {
    return undefined;
  }

  const allowedImages = new Set<string>();

  for (const page of pages) {
    for (const image of page.images) {
      const src = safeHtmlXmlImageSrc(image.src);

      if (src === undefined) {
        continue;
      }

      const imagePath = joinJobPath(outputDirectory, basename(src));
      const exists = await access(imagePath)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        allowedImages.add(src);
      }
    }
  }

  return { pages, allowedImages };
}
