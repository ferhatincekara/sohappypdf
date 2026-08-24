import type { ToolDefinition } from "@repo/tools/catalog";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import {
  PUBLIC_ANONYMOUS_MAX_FILE_SIZE_BYTES,
  PUBLIC_ANONYMOUS_RETENTION_HOURS,
} from "../lib/anonymous-limits";
import { formatAcceptedFormats, formatLabel } from "../lib/format-labels";
import { maxFilesForTool } from "../lib/tool-limits";
import { PublicToolWorkspace } from "./public-tool-workspace";

export type RelatedPublicTool = {
  id: string;
  href: `/${string}`;
};

export async function PublicToolPageContent({
  tool,
  isAuthenticated,
  relatedTools,
  maxAuthenticatedFileSizeBytes,
}: {
  tool: ToolDefinition;
  isAuthenticated: boolean;
  relatedTools: readonly RelatedPublicTool[];
  maxAuthenticatedFileSizeBytes: number;
}) {
  const t = await getTranslations("publicTools");
  const tTools = await getTranslations("tools");
  const tNav = await getTranslations("marketing.nav");

  const maxFiles = maxFilesForTool(tool, !isAuthenticated);
  const maxFileSizeBytes = isAuthenticated
    ? maxAuthenticatedFileSizeBytes
    : PUBLIC_ANONYMOUS_MAX_FILE_SIZE_BYTES;
  const sizeMb = Math.floor(maxFileSizeBytes / (1024 * 1024));
  const formats = formatAcceptedFormats(
    tool.inputFormats,
    t("upload.conjunction"),
  );
  const outputs = formatAcceptedFormats(
    tool.outputFormats,
    t("upload.conjunction"),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10 sm:py-14">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            {tNav(`categories.${tool.category}`)}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {tTools(`${tool.id}.name`)}
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground text-pretty">
            {tTools(`${tool.id}.description`)}
          </p>
        </div>

        <dl className="grid gap-3 rounded-lg border border-border bg-card p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="font-medium text-foreground">
              {t("overview.accepts")}
            </dt>
            <dd className="mt-1 text-muted-foreground">{formats}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">
              {t("overview.outputs")}
            </dt>
            <dd className="mt-1 text-muted-foreground">{outputs}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">
              {t("overview.limits")}
            </dt>
            <dd className="mt-1 text-muted-foreground">
              {t("limits", {
                files: maxFiles,
                sizeMb,
                hours: PUBLIC_ANONYMOUS_RETENTION_HOURS,
              })}
            </dd>
          </div>
        </dl>

        <ol className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["upload", formats],
              ["process", formatLabel(tool.outputFormats[0] ?? "pdf")],
              ["download", formatLabel(tool.outputFormats[0] ?? "pdf")],
            ] as const
          ).map(([step, detail], index) => (
            <li
              key={step}
              className="rounded-lg border border-border bg-card p-4"
            >
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("overview.step", { number: index + 1 })}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {t(`overview.steps.${step}.title`)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`overview.steps.${step}.description`, { detail })}
              </p>
            </li>
          ))}
        </ol>

        {tool.allowsAnonymous ? null : (
          <p className="text-sm text-muted-foreground">
            {t("descriptionAuthenticated")}
          </p>
        )}
      </header>

      <PublicToolWorkspace tool={tool} />

      {relatedTools.length > 0 ? (
        <section
          aria-labelledby="related-tools-heading"
          className="border-t border-border pt-8"
        >
          <h2
            id="related-tools-heading"
            className="text-lg font-semibold tracking-tight"
          >
            {t("related.title")}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedTools.map((related) => (
              <li key={related.id}>
                <Link
                  href={related.href}
                  className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <p className="text-sm font-medium text-foreground">
                    {tTools(`${related.id}.name`)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tTools(`${related.id}.description`)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
