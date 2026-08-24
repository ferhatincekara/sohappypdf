import type { ToolDefinition } from "@repo/tools/catalog";
import { getTranslations } from "next-intl/server";
import { getPublicWebEnv } from "@/config/public-env";
import { Link } from "@/lib/i18n/navigation";
import {
  PUBLIC_ANONYMOUS_MAX_FILE_SIZE_BYTES,
  PUBLIC_ANONYMOUS_RETENTION_HOURS,
} from "../lib/anonymous-limits";
import { dedicatedHowToForTool } from "../lib/dedicated-tool-how-to";
import { formatAcceptedFormats, formatLabel } from "../lib/format-labels";
import type { PublicToolFaqItem } from "../lib/public-tool-json-ld";
import { publicToolCanonicalUrl } from "../lib/public-tool-metadata";
import { maxFilesForTool } from "../lib/tool-limits";
import { PublicToolFaq } from "./public-tool-faq";
import { PublicToolJsonLd } from "./public-tool-json-ld";
import { PublicToolWorkspace } from "./public-tool-workspace";
import { RecentExecutions } from "./recent-executions";
import { ToolHeader } from "./tool-header";

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
  const name = tTools(`${tool.id}.name`);
  const description = tTools(`${tool.id}.description`);
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
  const howTo = dedicatedHowToForTool(tool.id);
  const faq: readonly PublicToolFaqItem[] = [
    {
      id: "what",
      question: t("faq.what.question", { tool: name }),
      answer: description,
    },
    {
      id: "how",
      question: t("faq.how.question"),
      answer:
        howTo === null
          ? t("faq.how.answer")
          : t(`workspaces.${howTo.workspace}.faqHow`),
    },
    {
      id: "formats",
      question: t("faq.formats.question"),
      answer: t("faq.formats.answer", { formats, outputs }),
    },
    {
      id: "account",
      question: t("faq.account.question"),
      answer: tool.allowsAnonymous
        ? t("faq.account.anonymous")
        : t("faq.account.required"),
    },
    {
      id: "limits",
      question: t("faq.limits.question"),
      answer: t("faq.limits.answer", {
        files: maxFiles,
        sizeMb,
        hours: PUBLIC_ANONYMOUS_RETENTION_HOURS,
      }),
    },
    {
      id: "privacy",
      question: t("faq.privacy.question"),
      answer: t("faq.privacy.answer", {
        hours: PUBLIC_ANONYMOUS_RETENTION_HOURS,
      }),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:py-14">
      <PublicToolJsonLd
        name={name}
        description={description}
        url={publicToolCanonicalUrl({
          appUrl: getPublicWebEnv().appUrl,
          path: tool.route,
        })}
        faq={faq}
      />
      <div className="mx-auto w-full max-w-3xl">
        <ToolHeader
          category={tNav(`categories.${tool.category}`)}
          name={name}
          description={description}
          authenticationNotice={
            tool.allowsAnonymous || isAuthenticated
              ? null
              : t("descriptionAuthenticated")
          }
        />
      </div>

      <PublicToolWorkspace tool={tool} />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <RecentExecutions />

        <section
          aria-labelledby="how-to-heading"
          className="flex flex-col gap-3"
        >
          <h2
            id="how-to-heading"
            className="text-lg font-semibold tracking-tight"
          >
            {t("overview.howTitle")}
          </h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {howTo === null
              ? (
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
                ))
              : howTo.steps.map((step, index) => (
                  <li
                    key={step}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {t("overview.step", { number: index + 1 })}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {t(`workspaces.${howTo.workspace}.how.${step}.title`)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(
                        `workspaces.${howTo.workspace}.how.${step}.description`,
                      )}
                    </p>
                  </li>
                ))}
          </ol>
        </section>

        <section
          aria-labelledby="formats-heading"
          className="flex flex-col gap-3"
        >
          <h2
            id="formats-heading"
            className="text-lg font-semibold tracking-tight"
          >
            {t("overview.detailsTitle")}
          </h2>
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
        </section>

        <section
          aria-labelledby="privacy-heading"
          className="flex flex-col gap-2"
        >
          <h2
            id="privacy-heading"
            className="text-lg font-semibold tracking-tight"
          >
            {t("privacy.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {t("privacy.body", { hours: PUBLIC_ANONYMOUS_RETENTION_HOURS })}
          </p>
        </section>

        <PublicToolFaq title={t("faq.title")} items={faq} />

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
    </div>
  );
}
