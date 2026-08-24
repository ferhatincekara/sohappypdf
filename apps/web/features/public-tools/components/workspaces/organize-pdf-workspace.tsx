"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  canDeleteOrganizeSlot,
  createOrganizeSlots,
  deleteOrganizeSlot,
  deleteSelectedOrganizeSlots,
  duplicateSelectedOrganizeSlots,
  isValidOrganizeOrder,
  moveOrganizeSlot,
  type OrganizeSlot,
  organizeSlotsFromOrder,
  organizeSlotsToPdfPages,
  rotateOrganizeSlot,
  rotateSelectedOrganizeSlots,
  selectedVisualPages,
  serializeOrganizeOrder,
  serializeOrganizeRotations,
  setOrganizeSelection,
} from "../../lib/organize-pages";
import {
  parseOrganizeOrderInput,
  parseOrganizeRotationsInput,
  type ToolWorkspaceState,
} from "../../lib/tool-workspace";
import {
  type PdfDocumentState,
  PdfPageGrid,
  PdfPageGridSkeleton,
  usePdfDocument,
  usePdfPageSelection,
} from "../../pdf-workspace";
import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { ToolFileCard } from "../tool-file-card";
import { ToolSelectedActions } from "../tool-selected-actions";
import { OrganizeAdvancedOrder } from "./organize-advanced-order";
import { OrganizePageOverlay } from "./organize-page-overlay";
import { OrganizePdfToolbar } from "./organize-pdf-toolbar";
import { OrganizeResultSummary } from "./organize-result-summary";

export function OrganizePdfWorkspace(props: ToolSelectedWorkspaceProps) {
  const t = useTranslations("publicTools");
  const entry = props.state.files[0];
  const pdf = usePdfDocument(entry?.file ?? null);

  if (entry === undefined) {
    return null;
  }

  const canOrganize =
    props.canProcess &&
    parseOrganizeOrderInput(props.workspaceState.pageOrder) !== undefined &&
    entry.status === "ready";

  return (
    <div className="flex flex-col gap-6">
      <ToolFileCard
        entry={entry}
        pageCount={pdf.status === "ready" ? pdf.pageCount : entry.pageCount}
        accept={props.accept}
        disabled={props.disabled}
        onRemove={() => {
          props.onRemove(entry.id);
        }}
        onReplace={props.onReplaceFiles}
        onRetry={() => {
          props.onRetryUpload(entry.id);
        }}
      />

      <section
        className="flex flex-col gap-4"
        aria-labelledby="organize-pages-heading"
      >
        <div className="flex flex-col gap-1">
          <h2
            id="organize-pages-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {t("workspaces.organize.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {t("workspaces.organize.hint")}
          </p>
        </div>

        {pdf.status === "loading" ? <PdfPageGridSkeleton /> : null}

        {pdf.status === "error" ? (
          <p className="text-sm text-muted-foreground text-pretty">
            {pdf.errorKey === "passwordProtected"
              ? t("workspaces.organize.passwordProtected")
              : t("workspaces.organize.previewFailed")}
          </p>
        ) : null}

        {pdf.status === "ready" && pdf.document !== null ? (
          <OrganizePdfPagesPanel
            key={entry.id}
            pdf={pdf}
            disabled={props.disabled}
            workspaceState={props.workspaceState}
            setWorkspaceState={props.setWorkspaceState}
          />
        ) : null}
      </section>

      {pdf.status === "ready" || pdf.status === "error" ? (
        <OrganizeResultSummary
          sourcePageCount={pdf.pageCount}
          resultPageCount={
            parseOrganizeOrderInput(props.workspaceState.pageOrder)?.length ?? 0
          }
        />
      ) : null}

      <ToolSelectedActions
        toolRoute={props.tool.route}
        state={props.state}
        canProcess={canOrganize}
        processLabel={props.processLabel}
        disabledReason={
          parseOrganizeOrderInput(props.workspaceState.pageOrder) === undefined
            ? t("workspaces.organize.selectPrompt")
            : null
        }
        onProcess={props.onProcess}
      />
    </div>
  );
}

function OrganizePdfPagesPanel({
  pdf,
  disabled,
  workspaceState,
  setWorkspaceState,
}: {
  pdf: PdfDocumentState;
  disabled: boolean;
  workspaceState: ToolWorkspaceState;
  setWorkspaceState: (next: ToolWorkspaceState) => void;
}) {
  const [slots, setSlots] = useState<OrganizeSlot[]>(() =>
    initialOrganizeSlots(pdf.pageCount, workspaceState),
  );

  function commit(next: OrganizeSlot[]): void {
    setSlots(next);
    setWorkspaceState({
      ...workspaceState,
      pageOrder: serializeOrganizeOrder(next),
      pageRotations: serializeOrganizeRotations(next),
    });
  }

  // Identity order is written once when pages first become available.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only hydrate
  useEffect(() => {
    if (workspaceState.pageOrder.trim().length > 0) {
      return;
    }

    setWorkspaceState({
      ...workspaceState,
      pageOrder: serializeOrganizeOrder(slots),
      pageRotations: serializeOrganizeRotations(slots),
    });
  }, []);

  const selection = usePdfPageSelection({
    pageCount: slots.length,
    selectedPages: selectedVisualPages(slots),
    onSelectedPagesChange: (pages) => {
      commit(setOrganizeSelection(slots, pages));
    },
  });

  if (pdf.document === null) {
    return null;
  }

  return (
    <>
      <OrganizePdfToolbar
        slots={slots}
        pageCount={pdf.pageCount}
        disabled={disabled}
        onSelectAll={selection.selectAll}
        onClear={selection.clear}
        onRotateLeft={() => {
          commit(rotateSelectedOrganizeSlots(slots, -90));
        }}
        onRotateRight={() => {
          commit(rotateSelectedOrganizeSlots(slots, 90));
        }}
        onDuplicate={() => {
          commit(duplicateSelectedOrganizeSlots(slots));
        }}
        onDelete={() => {
          commit(deleteSelectedOrganizeSlots(slots));
        }}
        onReset={() => {
          commit(createOrganizeSlots(pdf.pageCount));
        }}
      />
      <PdfPageGrid
        document={pdf.document}
        pages={organizeSlotsToPdfPages(slots)}
        disabled={disabled}
        reorderable
        renderPageOverlay={(page) => (
          <OrganizePageOverlay
            page={page}
            disabled={disabled}
            canDelete={canDeleteOrganizeSlot(slots, page.id)}
            onRotate={(id) => {
              commit(rotateOrganizeSlot(slots, id, 90));
            }}
            onDelete={(id) => {
              commit(deleteOrganizeSlot(slots, id));
            }}
          />
        )}
        onActivate={(page, modifiers) => {
          selection.activate(page.pageIndex + 1, modifiers);
        }}
        onReorder={(fromIndex, toIndex) => {
          commit(moveOrganizeSlot(slots, fromIndex, toIndex));
        }}
      />
      <OrganizeAdvancedOrder
        slots={slots}
        pageCount={pdf.pageCount}
        disabled={disabled}
        onApply={commit}
      />
    </>
  );
}

function initialOrganizeSlots(
  pageCount: number,
  workspaceState: ToolWorkspaceState,
): OrganizeSlot[] {
  const order = parseOrganizeOrderInput(workspaceState.pageOrder);
  const rotations =
    order === undefined
      ? undefined
      : parseOrganizeRotationsInput(workspaceState.pageRotations, order.length);

  if (
    order !== undefined &&
    isValidOrganizeOrder(order, pageCount) &&
    (workspaceState.pageRotations.trim().length === 0 ||
      rotations !== undefined)
  ) {
    return organizeSlotsFromOrder(order, rotations);
  }

  return createOrganizeSlots(pageCount);
}
