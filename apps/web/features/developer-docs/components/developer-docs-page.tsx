import { getTranslations } from "next-intl/server";
import { getPublicApiV1BaseUrl } from "@/config/public-env";
import { Link } from "@/lib/i18n/navigation";
import {
  authorizationExample,
  conversionExample,
  downloadExample,
  pollExample,
  uploadExample,
} from "../lib/example-snippets";
import { listPublicApiTools } from "../lib/public-api-tools";

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border bg-muted px-4 py-3 font-mono text-xs text-foreground">
      {children}
    </pre>
  );
}

export async function DeveloperDocsPage() {
  const apiV1BaseUrl = getPublicApiV1BaseUrl();
  const tTools = await getTranslations("tools");
  const tools = listPublicApiTools();

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/" className="underline underline-offset-4">
            Home
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          SohappyPDF API
        </h1>
        <p className="text-sm text-muted-foreground">
          English-first developer reference for the public v1 API. The dashboard
          stays localized. Machine-readable contract:{" "}
          <code>{apiV1BaseUrl}/openapi.json</code>.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Getting started</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            Create a key in{" "}
            <Link href="/account/api" className="underline underline-offset-4">
              API Keys
            </Link>
            .
          </li>
          <li>Send it as a Bearer token. Never put it in a URL.</li>
          <li>Upload with a presigned PUT, then create a conversion.</li>
          <li>Poll until completed, then download the output file.</li>
        </ol>
        <p className="text-sm text-muted-foreground">
          Base URL: <code>{apiV1BaseUrl}</code>
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Authentication</h2>
        <CodeBlock>{authorizationExample()}</CodeBlock>
        <p className="text-sm text-muted-foreground">
          API credits are billed separately from web tool credits. The raw key
          is shown only once when you create it.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Upload</h2>
        <CodeBlock>{uploadExample(apiV1BaseUrl)}</CodeBlock>
        <p className="text-sm text-muted-foreground">
          PUT the file bytes to <code>upload.url</code>, then POST{" "}
          <code>/files/FILE_ID/complete</code>.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Create conversion</h2>
        <CodeBlock>{conversionExample(apiV1BaseUrl)}</CodeBlock>
        <p className="text-sm text-muted-foreground">
          The API returns HTTP 201 and processes the job asynchronously.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Poll conversion</h2>
        <CodeBlock>{pollExample(apiV1BaseUrl)}</CodeBlock>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Download result</h2>
        <CodeBlock>{downloadExample(apiV1BaseUrl)}</CodeBlock>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Supported tools</h2>
        <p className="text-sm text-muted-foreground">
          These tools are available on the public API. Credit costs come from
          the tool catalog. Planned tools are omitted until they ship.
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          {tools.map((tool) => (
            <li
              key={tool.id}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-2 last:border-b-0"
            >
              <span>{tTools(`${tool.id}.name`)}</span>
              <span className="text-muted-foreground">
                {tool.apiCreditCost} API credits
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Errors and limits</h2>
        <p className="text-sm text-muted-foreground">
          Errors use{" "}
          <code>{`{ "error": { "code", "message", "requestId" } }`}</code>. Rate
          limits return 429 with Retry-After. Plan quotas return 403. Full
          reference: <code>docs/api/v1.md</code> in the repository.
        </p>
      </section>
    </article>
  );
}
