"use client";

import { resolveToolWorkspaceKind } from "../../lib/tool-workspace-kind";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { CompressPdfWorkspace } from "./compress-pdf-workspace";
import { ConvertPdfWorkspace } from "./convert-pdf-workspace";
import { CropPdfWorkspace } from "./crop-pdf-workspace";
import { DefaultToolWorkspace } from "./default-tool-workspace";
import { EditPdfWorkspace } from "./edit-pdf-workspace";
import { ExtractPagesWorkspace } from "./extract-pages-workspace";
import { FillPdfWorkspace } from "./fill-pdf-workspace";
import { ImageToPdfWorkspace } from "./image-to-pdf-workspace";
import { MergePdfWorkspace } from "./merge-pdf-workspace";
import { OcrPdfWorkspace } from "./ocr-pdf-workspace";
import { OrganizePdfWorkspace } from "./organize-pdf-workspace";
import { ProtectPdfWorkspace } from "./protect-pdf-workspace";
import { RemovePagesWorkspace } from "./remove-pages-workspace";
import { RepairPdfWorkspace } from "./repair-pdf-workspace";
import { RotatePdfWorkspace } from "./rotate-pdf-workspace";
import { SignPdfWorkspace } from "./sign-pdf-workspace";
import { SplitPdfWorkspace } from "./split-pdf-workspace";
import { UnlockPdfWorkspace } from "./unlock-pdf-workspace";
import { WatermarkPdfWorkspace } from "./watermark-pdf-workspace";

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
    case "protect":
      return <ProtectPdfWorkspace {...props} />;
    case "unlock":
      return <UnlockPdfWorkspace {...props} />;
    case "watermark":
      return <WatermarkPdfWorkspace {...props} />;
    case "crop":
      return <CropPdfWorkspace {...props} />;
    case "sign":
      return <SignPdfWorkspace {...props} />;
    case "fill":
      return <FillPdfWorkspace {...props} />;
    case "edit":
      return <EditPdfWorkspace {...props} />;
    case "repair":
      return <RepairPdfWorkspace {...props} />;
    case "ocr":
      return <OcrPdfWorkspace {...props} />;
    default:
      return <DefaultToolWorkspace {...props} />;
  }
}
