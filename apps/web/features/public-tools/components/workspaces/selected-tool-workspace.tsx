"use client";

import { resolveToolWorkspaceKind } from "../../lib/tool-workspace-kind";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { CompressPdfWorkspace } from "./compress-pdf-workspace";
import { ConvertPdfWorkspace } from "./convert-pdf-workspace";
import { DefaultToolWorkspace } from "./default-tool-workspace";
import { ExtractPagesWorkspace } from "./extract-pages-workspace";
import { ImageToPdfWorkspace } from "./image-to-pdf-workspace";
import { MergePdfWorkspace } from "./merge-pdf-workspace";
import { OcrPdfWorkspace } from "./ocr-pdf-workspace";
import { OrganizePdfWorkspace } from "./organize-pdf-workspace";
import { PasswordPdfWorkspace } from "./password-pdf-workspace";
import { RemovePagesWorkspace } from "./remove-pages-workspace";
import { RepairPdfWorkspace } from "./repair-pdf-workspace";
import { RotatePdfWorkspace } from "./rotate-pdf-workspace";
import { SplitPdfWorkspace } from "./split-pdf-workspace";

export function SelectedToolWorkspace(props: ToolSelectedWorkspaceProps) {
  switch (resolveToolWorkspaceKind(props.tool.id)) {
    case "split":
      return <SplitPdfWorkspace {...props} />;
    case "extract":
      return <ExtractPagesWorkspace {...props} />;
    case "organize":
      return <OrganizePdfWorkspace {...props} />;
    case "merge":
      return <MergePdfWorkspace {...props} />;
    case "rotate":
      return <RotatePdfWorkspace {...props} />;
    case "remove":
      return <RemovePagesWorkspace {...props} />;
    case "compress":
      return <CompressPdfWorkspace {...props} />;
    case "convert":
      return <ConvertPdfWorkspace {...props} />;
    case "imageToPdf":
      return <ImageToPdfWorkspace {...props} />;
    case "password":
      return <PasswordPdfWorkspace {...props} />;
    case "repair":
      return <RepairPdfWorkspace {...props} />;
    case "ocr":
      return <OcrPdfWorkspace {...props} />;
    default:
      return <DefaultToolWorkspace {...props} />;
  }
}
