import type { ToolDefinition } from "@repo/tools/catalog";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getPublicWebEnv } from "@/config/public-env";
import type { WebToolBilling } from "@/features/billing/lib/web-tool-billing";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { getMarketingToolIcon } from "@/features/marketing/lib/marketing-tool-icon";
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
import { PublicToolJsonLd } from "./public-tool-json-ld";
import { PublicToolWorkspace } from "./public-tool-workspace";
import { RecentExecutions } from "./recent-executions";
import { ToolHeader } from "./tool-header";

export type RelatedPublicTool = {
  id: string;
  href: `/${string}`;
  icon: string;
};

type HowToStep = {
  key: string;
  title: string;
  description: string;
};

export async function PublicToolPageContent({
  tool,
  isAuthenticated,
  relatedTools,
  maxAuthenticatedFileSizeBytes,
  billing,
}: {
  tool: ToolDefinition;
  isAuthenticated: boolean;
  relatedTools: readonly RelatedPublicTool[];
  maxAuthenticatedFileSizeBytes: number;
  billing?: WebToolBilling | null;
}) {
  const t = await getTranslations("publicTools");
  const tTools = await getTranslations("tools");
  const tNav = await getTranslations("marketing.nav");
  const name = tTools(`${tool.id}.name`);
  const description = tTools(`${tool.id}.description`);
  const maxFiles = maxFilesForTool(tool, {
    anonymous: !isAuthenticated,
    plan: billing?.plan,
    maxFilesPerOperation: billing?.maxFilesPerOperation,
  });
  const maxFileSizeBytes = isAuthenticated
    ? (billing?.maxFileSizeBytes ?? maxAuthenticatedFileSizeBytes)
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
  const outputLabel = formatLabel(tool.outputFormats[0] ?? "pdf");
  const howToSteps: readonly HowToStep[] =
    howTo === null
      ? [
          {
            key: "upload",
            title: t("overview.steps.upload.title"),
            description: t("overview.steps.upload.description", {
              detail: formats,
            }),
          },
          {
            key: "process",
            title: t("overview.steps.process.title"),
            description: t("overview.steps.process.description", {
              detail: outputLabel,
            }),
          },
          {
            key: "download",
            title: t("overview.steps.download.title"),
            description: t("overview.steps.download.description", {
              detail: outputLabel,
            }),
          },
        ]
      : howTo.steps.map((step) => ({
          key: step,
          title: t(`workspaces.${howTo.workspace}.how.${step}.title`),
          description: t(
            `workspaces.${howTo.workspace}.how.${step}.description`,
          ),
        }));

  return (
    <div className="pb-6 pt-5 md:pb-16 md:pt-10">
      <PublicToolJsonLd
        name={name}
        description={description}
        url={publicToolCanonicalUrl({
          appUrl: getPublicWebEnv().appUrl,
          path: tool.route,
        })}
        faq={faq}
      />
      <MarketingContainer>
        <Link
          href={MARKETING_PATHS.tools}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          {tNav("allTools")}
        </Link>

        <div className="mt-6 md:mt-8">
          <PublicToolWorkspace
            tool={tool}
            isAuthenticated={isAuthenticated}
            billing={billing}
            header={
              <ToolHeader
                icon={tool.icon}
                category={tNav(`categories.${tool.category}`)}
                name={name}
                description={description}
                authenticationNotice={
                  tool.allowsAnonymous || isAuthenticated
                    ? null
                    : t("descriptionAuthenticated")
                }
              />
            }
            guide={
              <>
                <h2 className="text-base font-extrabold tracking-tight">
                  {t("overview.howTitle")}
                </h2>
                <ol className="mt-4 space-y-3 md:mt-5 md:space-y-4">
                  {howToSteps.map((step, index) => (
                    <li key={step.key} className="flex gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold tabular-nums">
                        {index + 1}
                      </span>
                      <div className="pt-0.5">
                        <p className="text-sm font-semibold text-foreground">
                          {step.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                {relatedTools.length > 0 ? (
                  <>
                    <h3 className="mt-5 border-t border-black/10 pt-4 text-xs font-bold tracking-wider text-muted-foreground uppercase md:mt-8 md:pt-6">
                      {t("related.title")}
                    </h3>
                    <ul className="divide-y divide-black/10">
                      {relatedTools.map((related) => {
                        const Icon = getMarketingToolIcon(related.icon);

                        return (
                          <li key={related.id}>
                            <Link
                              href={related.href}
                              className="flex items-center gap-2.5 py-2.5 text-base font-medium text-foreground transition-opacity hover:opacity-60"
                            >
                              <Icon
                                className="size-4 shrink-0 text-foreground/70"
                                aria-hidden="true"
                              />
                              {tTools(`${related.id}.name`)}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : null}
              </>
            }
          />
        </div>

        <div className="mt-6 md:mt-12">
          <RecentExecutions isAuthenticated={isAuthenticated} />
        </div>
      </MarketingContainer>
    </div>
  );
}
