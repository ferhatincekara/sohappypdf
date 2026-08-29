import {
  DEFAULT_PLAN_LIMITS,
  INCLUDED_API_CREDITS_PER_MONTH,
} from "@sohappypdf/billing/plans";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { getPublicApiV1BaseUrl } from "@/config/public-env";
import { APP_PATHS } from "@/features/app-shell/config/app-paths";
import { CodeBlock } from "@/features/developer-docs/components/code-block";
import { DeveloperDocsToc } from "@/features/developer-docs/components/developer-docs-toc";
import { DeveloperToolReference } from "@/features/developer-docs/components/developer-tool-reference";
import { DEVELOPER_TOC_IDS } from "@/features/developer-docs/lib/developer-toc";
import {
  authorizationExample,
  cancelExample,
  completeUploadExample,
  conversionExample,
  downloadExample,
  errorEnvelopeExample,
  pollExample,
  putUploadExample,
  uploadExample,
} from "@/features/developer-docs/lib/example-snippets";
import {
  CONVERSION_POLL_STATUSES,
  CONVERSION_TERMINAL_STATUSES,
  PUBLIC_API_ERROR_CODES,
} from "@/features/developer-docs/lib/public-api-errors";
import {
  listPublicApiToolCategories,
  listPublicApiTools,
} from "@/features/developer-docs/lib/public-api-tools";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { Link } from "@/lib/i18n/navigation";

export async function DeveloperDocsPage() {
  const apiV1BaseUrl = getPublicApiV1BaseUrl();
  const t = await getTranslations("developerDocs");
  const tools = listPublicApiTools();
  const categories = listPublicApiToolCategories(tools);
  const openApiUrl = `${apiV1BaseUrl}/openapi.json`;

  return (
    <div className="pb-12 pt-8">
      <MarketingContainer className="grid gap-12 lg:grid-cols-[--spacing(55)_minmax(0,1fr)]">
        <DeveloperDocsToc
          ariaLabel={t("toc.label")}
          heading={t("toc.label")}
          items={DEVELOPER_TOC_IDS.map((id) => ({
            id,
            label: t(`toc.${id}`),
          }))}
        />

        <article className="flex min-w-0 flex-col gap-16">
          <header className="flex max-w-3xl flex-col gap-4">
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t("eyebrow")}
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              {t("title")}
            </h1>
            <p className="text-lg/7 text-muted-foreground">
              {t("description")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                nativeButton={false}
                render={<Link href={APP_PATHS.apiKeys} />}
              >
                {t("createKey")}
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={MARKETING_PATHS.pricing} />}
              >
                {t("viewPricing")}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("baseUrl")}: <code>{apiV1BaseUrl}</code>
            </p>
            <p className="text-sm text-muted-foreground">
              {t("openapi")}: <code>{openApiUrl}</code>
            </p>
          </header>

          <section id="quickstart" className="scroll-mt-28 flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("quickstart.title")}
            </h2>
            <ol className="list-decimal space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>{t("quickstart.step1")}</li>
              <li>{t("quickstart.step2")}</li>
              <li>{t("quickstart.step3")}</li>
              <li>{t("quickstart.step4")}</li>
              <li>{t("quickstart.step5")}</li>
            </ol>
            <CodeBlock
              label={t("quickstart.uploadLabel")}
              code={uploadExample(apiV1BaseUrl)}
            />
            <CodeBlock
              label={t("quickstart.putLabel")}
              code={putUploadExample()}
            />
            <CodeBlock
              label={t("quickstart.completeLabel")}
              code={completeUploadExample(apiV1BaseUrl)}
            />
            <CodeBlock
              label={t("quickstart.convertLabel")}
              code={conversionExample(apiV1BaseUrl)}
            />
          </section>

          <section id="auth" className="scroll-mt-28 flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("auth.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("auth.description")}
            </p>
            <CodeBlock label="HTTP" code={authorizationExample()} />
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>{t("auth.ruleHeader")}</li>
              <li>{t("auth.ruleSecret")}</li>
              <li>{t("auth.ruleBrowser")}</li>
              <li>{t("auth.ruleRevoke")}</li>
            </ul>
          </section>

          <section id="files" className="scroll-mt-28 flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("files.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("files.description")}
            </p>
            <CodeBlock
              label="POST /files/upload → PUT → POST /files/{id}/complete"
              code={[
                "POST /files/upload",
                "PUT  upload.url   (file bytes, not through the API)",
                "POST /files/{id}/complete",
              ].join("\n")}
            />
            <p className="text-sm text-muted-foreground">{t("files.expiry")}</p>
          </section>

          <section
            id="conversions"
            className="scroll-mt-28 flex flex-col gap-4"
          >
            <h2 className="text-2xl font-bold tracking-tight">
              {t("conversions.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("conversions.description")}
            </p>
            <CodeBlock
              label="POST /conversions"
              code={conversionExample(apiV1BaseUrl)}
            />
            <p className="text-sm text-muted-foreground">
              {t("conversions.pollHint", {
                pending: CONVERSION_POLL_STATUSES.join(", "),
                done: CONVERSION_TERMINAL_STATUSES.join(", "),
              })}
            </p>
            <CodeBlock
              label="GET /conversions/{id}"
              code={pollExample(apiV1BaseUrl)}
            />
            <CodeBlock
              label="POST /files/{outputFileId}/download"
              code={downloadExample(apiV1BaseUrl)}
            />
            <CodeBlock
              label="POST /conversions/{id}/cancel"
              code={cancelExample(apiV1BaseUrl)}
            />
            <p className="text-sm text-muted-foreground">
              {t("conversions.idempotency")}
            </p>
          </section>

          <section id="tools" className="scroll-mt-28 flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("tools.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("tools.description")}
            </p>
            <DeveloperToolReference tools={tools} categories={categories} />
          </section>

          <section id="errors" className="scroll-mt-28 flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("errors.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("errors.description")}
            </p>
            <CodeBlock label="JSON" code={errorEnvelopeExample()} />
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-md text-left text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      {t("errors.code")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("errors.status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PUBLIC_API_ERROR_CODES.map((item) => (
                    <tr key={item.code} className="border-t border-border">
                      <td className="px-4 py-2 font-mono text-xs">
                        {item.code}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground">{t("errors.retry")}</p>
          </section>

          <section id="limits" className="scroll-mt-28 flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("limits.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("limits.description")}
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                {t("limits.free", {
                  ops: DEFAULT_PLAN_LIMITS.free.operationsPerDay ?? 0,
                  rpm: DEFAULT_PLAN_LIMITS.free.apiRequestsPerMinute,
                })}
              </li>
              <li>
                {t("limits.pro", {
                  rpm: DEFAULT_PLAN_LIMITS.pro.apiRequestsPerMinute,
                })}
              </li>
              <li>
                {t("limits.credits", {
                  count: INCLUDED_API_CREDITS_PER_MONTH,
                })}
              </li>
              <li>{t("limits.webhooks")}</li>
            </ul>
          </section>
        </article>
      </MarketingContainer>
    </div>
  );
}
