export function resolveDefaultWorkspaceHeading(
  toolId: string,
):
  | "workspaces.rotate.title"
  | "workspaces.organize.title"
  | "workspaces.remove.title"
  | "workspaces.ocr.title"
  | "workspaces.sign.title"
  | "workspaces.edit.title"
  | "workspaces.generic.title" {
  switch (toolId) {
    case "rotate-pdf":
      return "workspaces.rotate.title";
    case "organize-pdf":
    case "reorder-pages":
      return "workspaces.organize.title";
    case "remove-pages":
      return "workspaces.remove.title";
    case "ocr-pdf":
    case "ocr-image":
      return "workspaces.ocr.title";
    case "sign-pdf":
      return "workspaces.sign.title";
    case "edit-pdf":
      return "workspaces.edit.title";
    default:
      return "workspaces.generic.title";
  }
}
