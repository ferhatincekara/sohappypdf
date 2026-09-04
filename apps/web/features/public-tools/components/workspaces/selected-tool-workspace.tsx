"use client";

import { CompressPdfWorkspace } from "@/features/public-tools/components/workspaces/compress-pdf-workspace";
import { ConvertPdfWorkspace } from "@/features/public-tools/components/workspaces/convert-pdf-workspace";
import { CropPdfWorkspace } from "@/features/public-tools/components/workspaces/crop-pdf-workspace";
import { DefaultToolWorkspace } from "@/features/public-tools/components/workspaces/default-tool-workspace";
import { EditPdfWorkspace } from "@/features/public-tools/components/workspaces/edit-pdf-workspace";
import { ExtractPagesWorkspace } from "@/features/public-tools/components/workspaces/extract-pages-workspace";
import { ImageToPdfWorkspace } from "@/features/public-tools/components/workspaces/image-to-pdf-workspace";
import { MergePdfWorkspace } from "@/features/public-tools/components/workspaces/merge-pdf-workspace";
import { OcrPdfWorkspace } from "@/features/public-tools/components/workspaces/ocr-pdf-workspace";
import { OrganizePdfWorkspace } from "@/features/public-tools/components/workspaces/organize-pdf-workspace";
import { ProtectPdfWorkspace } from "@/features/public-tools/components/workspaces/protect-pdf-workspace";
import { RemovePagesWorkspace } from "@/features/public-tools/components/workspaces/remove-pages-workspace";
import { RedactPdfWorkspace } from "@/features/public-tools/components/workspaces/redact-pdf-workspace";
import { RepairPdfWorkspace } from "@/features/public-tools/components/workspaces/repair-pdf-workspace";
import { RotatePdfWorkspace } from "@/features/public-tools/components/workspaces/rotate-pdf-workspace";
import { SignPdfWorkspace } from "@/features/public-tools/components/workspaces/sign-pdf-workspace";
import { SplitPdfWorkspace } from "@/features/public-tools/components/workspaces/split-pdf-workspace";
import { UnlockPdfWorkspace } from "@/features/public-tools/components/workspaces/unlock-pdf-workspace";
import { WatermarkPdfWorkspace } from "@/features/public-tools/components/workspaces/watermark-pdf-workspace";
import { resolveToolWorkspaceKind } from "@/features/public-tools/lib/tool-workspace-kind";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";

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
    case "edit":
      return <EditPdfWorkspace {...props} />;
    case "redact":
      return <RedactPdfWorkspace {...props} />;
    case "repair":
      return <RepairPdfWorkspace {...props} />;
    case "ocr":
      return <OcrPdfWorkspace {...props} />;
    default:
      return <DefaultToolWorkspace {...props} />;
  }
}
