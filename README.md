# SoHappyPDF

Tool-first SaaS PDF platform: public PDF tools, temporary file processing, OCR, and a public developer API.

The repository is a **Turborepo** monorepo. **Bun** is the only package manager. Do not introduce npm, pnpm, or yarn.

## Contents

- [Product](#product)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Scripts](#scripts)
- [Applications](#applications)
- [Packages](#packages)
- [Public API](#public-api)
- [Billing](#billing)
- [Internationalization](#internationalization)
- [Testing and checks](#testing-and-checks)
- [Documentation](#documentation)
- [Security](#security)

## Product

The primary surface is **public tool pages** (anonymous-friendly), for example `/merge-pdf`. Upload, process, and download happen on the tool page.

The secondary surface is the authenticated **account** area at `/account`: usage, billing, API keys, settings, and recent activity. It is not a file-management dashboard.

Files are **temporary** (about two hours). There is no permanent document library for normal tool usage. S3 lifecycle rules are a safety net for orphans, not the user-facing expiration.

Web credits meter authenticated browser usage. Anonymous users can use anonymous-allowed tools under daily and rate limits without a full credit account. API credits are separate from web credits.

Plans are **Free** and **Pro** (Polar.sh). Stripe is not used.

## Architecture

Three processes run together in development:

| App | Package | Port | Role |
| --- | --- | --- | --- |
| Web | `@sohappypdf/web` | `3000` | Next.js: marketing, tools, account |
| API | `@sohappypdf/api` | `3001` | Hono public API + Better Auth |
| Worker | `@sohappypdf/worker` | health `8080` | BullMQ conversions and file cleanup |

The API is a **separate host**. It is not served from the marketing origin under `/api`. Locally that is `http://localhost:3001`. In production it is `https://api.sohappypdf.com`.

```
Browser  →  apps/web (:3000)
                │
                └── HTTP  →  apps/api (:3001)
                                  │
                                  ├── Postgres (Neon / Drizzle)
                                  ├── S3 (presigned upload / download)
                                  ├── Upstash Redis (BullMQ + rate limits)
                                  └── enqueue job
                                            │
                                            └── apps/worker (:8080 health)
                                                      └── native engines + S3
```

Feature-specific code lives in the owning feature (for example `apps/web/features/api-keys`). Shared domain logic lives in `packages/`. Applications must not import source from another application.

Shared UI is shadcn/ui under `apps/web/components/ui`. There is no `@sohappypdf/ui` package.

## Prerequisites

### Required for local development

- [Bun](https://bun.sh) `1.3.x` (repo pins `1.3.14`)
- PostgreSQL reachable as `DATABASE_URL` (Neon is used in production)
- AWS S3 credentials and a bucket (uploads never go through the API as multipart)
- Upstash Redis REST URL and token (BullMQ + rate limiting)
- `BETTER_AUTH_SECRET` of at least 32 characters (`openssl rand -base64 32`)

### Required for conversions to actually run

The worker shells out to native binaries on `PATH`. Without them, jobs fail at process time.

| Binary | Typical package | Used for |
| --- | --- | --- |
| `soffice` | LibreOffice | Office ↔ PDF |
| `pdftoppm`, `pdftotext` | Poppler | Rasterize / extract text |
| `gs` | Ghostscript | PDF processing |
| `qpdf` | qpdf | Protect / unlock |
| `ocrmypdf` | OCRmyPDF (+ Tesseract) | OCR |

On macOS with Homebrew, a typical set is `libreoffice`, `poppler`, `ghostscript`, `qpdf`, `ocrmypdf`, and `tesseract`.

### Optional

- **Resend** — password-reset email. Tools work without it.
- **Polar.sh** — checkout and webhooks. Local webhooks cannot reach `localhost`; billing status reconciles on page load.

## Local setup

1. Clone the repository and install dependencies:

   ```bash
   bun install
   ```

2. Copy the environment template and fill required values. Do not commit `.env`.

   ```bash
   cp .env.example .env
   ```

   Minimum local values:

   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL=http://localhost:3001`
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
   - `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`
   - `APP_URL=http://localhost:3000`
   - `API_CORS_ORIGINS=http://localhost:3000` — comma-separated origins, **not** `*`
   - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

   Every variable and default is documented in [`.env.example`](./.env.example).

3. Apply Drizzle migrations before serving traffic:

   ```bash
   bun run db:migrate
   ```

4. Start web, API, and worker:

   ```bash
   bun run dev
   ```

5. Open:

   - Site: [http://localhost:3000](http://localhost:3000)
   - API health: [http://localhost:3001/v1/health](http://localhost:3001/v1/health)
   - OpenAPI: [http://localhost:3001/v1/openapi.json](http://localhost:3001/v1/openapi.json)
   - Worker health: [http://localhost:8080](http://localhost:8080)

## Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Start `@sohappypdf/web`, `@sohappypdf/api`, and `@sohappypdf/worker` |
| `bun run build` | Build all workspaces |
| `bun run lint` | Biome lint, format check, and import organization |
| `bun run format` | Apply Biome fixes |
| `bun run check-types` / `bun run typecheck` | TypeScript checks via Turbo |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Apply versioned Drizzle migrations |
| `bun test` | Run Bun tests in the current package (or a path) |

Root `dev` uses Turbo `--continue` so one app crashing does not stop the others.

## Applications

### `apps/web`

Customer-facing Next.js app.

| Area | Paths |
| --- | --- |
| Marketing | `/`, `/tools`, `/pricing`, `/faq`, `/blog`, `/about`, `/contact`, `/developers` |
| Legal | `/security`, `/privacy`, `/terms`, `/cookies` |
| Auth | `/login`, `/signup`, forgot / reset password |
| Account | `/account`, `/account/usage`, `/account/billing`, `/account/api`, `/account/settings`, `/account/activity` |

Tool pages own the end-to-end operation UX. Large files upload **browser → S3** with a presigned URL. The API never holds file bytes.

### `apps/api`

Hono app on port `3001`.

- Public contract: `/v1/*` (files, conversions, health, OpenAPI)
- Better Auth: `/api/auth/*` (web session, not the public developer surface)
- Account-only routes (session cookie, not an API key): `/v1/api-keys`, `/v1/billing`

The current public version is `/v1`. Additive changes may appear inside v1. Breaking changes require `/v2`.

### `apps/worker`

Consumes BullMQ conversion jobs, runs native engines, writes results to S3, and cleans up expired temporary files. Exposes a small health server on `WORKER_HEALTH_PORT` (default `8080`).

Long-running conversion work must not run in the HTTP request. `POST /v1/conversions` returns **201** and enqueues a job. Clients poll `GET /v1/conversions/{id}`.

## Packages

| Package | Role |
| --- | --- |
| `@sohappypdf/core` | Domain primitives and application errors |
| `@sohappypdf/utils` | Generic utilities, organized by purpose |
| `@sohappypdf/logger` | Structured logging |
| `@sohappypdf/config` | Environment and application configuration |
| `@sohappypdf/db` | Drizzle ORM, Neon client, schema |
| `@sohappypdf/auth` | Better Auth, anonymous sessions, Resend password reset |
| `@sohappypdf/storage` | S3 abstraction |
| `@sohappypdf/queue` | BullMQ queues and workers |
| `@sohappypdf/rate-limit` | Upstash rate limiting |
| `@sohappypdf/files` | Temporary file domain |
| `@sohappypdf/conversions` | Processing job / conversion domain |
| `@sohappypdf/conversion-engines` | Native conversion engines |
| `@sohappypdf/billing` | Polar.sh, entitlements, credit ledger |
| `@sohappypdf/api-keys` | API key lifecycle (create, list, hard delete, authenticate) |
| `@sohappypdf/tools` | Public tool catalog and credit pricing |
| `@sohappypdf/typescript-config` | Shared TypeScript configs |

Do not create dumping-ground files such as `utils.ts` or `helpers.ts`. Domain helpers stay in their domain.

## Public API

Full contract: [`docs/api/v1.md`](./docs/api/v1.md), OpenAPI at [`docs/api/openapi.json`](./docs/api/openapi.json), end-to-end script at [`docs/api/examples/workflow.sh`](./docs/api/examples/workflow.sh). In-app docs: `/developers`.

### Authentication

Create a key in the account area (`/account/api`). The raw secret is shown **once**. Send it only as:

```http
Authorization: Bearer YOUR_API_KEY
```

Never put keys in URLs, query parameters, browser JavaScript, or source control. If a key leaks, **delete** it in the account area and create a replacement. Deleting a key removes the row; a second delete returns `404`.

Key create / list / delete require a **dashboard session**. They are not part of the public key-authenticated surface.

### Canonical workflow

```
API key
  → POST /v1/files/upload          (presigned PUT intent)
  → PUT upload.url                 (bytes go to S3)
  → POST /v1/files/{id}/complete
  → POST /v1/conversions           (201, job queued)
  → GET  /v1/conversions/{id}      (poll every ~2s)
  → POST /v1/files/{output}/download
```

Local smoke check (replace the key; do not commit it):

```bash
export API_BASE='http://localhost:3001'
export API_KEY='YOUR_API_KEY'

curl -sS "$API_BASE/v1/health"
curl -sS "$API_BASE/v1/files" \
  -H "Authorization: Bearer $API_KEY"
```

There is no official SDK and no developer webhooks. Clients poll conversion status.

## Billing

Polar.sh owns checkout, customer portal, and subscription webhooks.

- **Web:** Free and Pro. Web credits are the primary authenticated tool meter.
- **API:** optional credit packs (Starter, Growth, Scale), billed separately. Unused API pack credits reset at the pack period end.
- Entitlements are enforced **server-side**.
- Catalog defaults live in `@sohappypdf/billing` (`DEFAULT_PLAN_LIMITS`). Hitting a quota returns `403` with `PLAN_LIMIT_REACHED` or `STORAGE_LIMIT_REACHED`.

Local Polar webhooks cannot reach this machine. After a sandbox checkout, reload the billing page so the API can reconcile.

## Internationalization

`apps/web` uses **next-intl** with locales `en` and `tr`. Locale is cookie-based (`NEXT_LOCALE`). URLs have **no** locale prefix (`localePrefix: "never"`). Copy lives in `apps/web/messages/en.json` and `apps/web/messages/tr.json`.

## Testing and checks

```bash
bun run lint
bun run check-types
bun test packages/api-keys
bun test apps/api/src/routes/api-keys
bun test apps/web/features/api-keys
```

Run `bun test` inside a workspace, or pass a file / folder path from the repo root.

## Documentation

| Doc | Purpose |
| --- | --- |
| [`.env.example`](./.env.example) | Environment template and defaults |
| [`docs/api/README.md`](./docs/api/README.md) | Public API index |
| [`docs/api/v1.md`](./docs/api/v1.md) | v1 human contract |
| [`docs/architecture/README.md`](./docs/architecture/README.md) | Live monorepo shape |
| [`AGENTS.md`](./AGENTS.md) | Agent / contributor rules |
| [`.cursor/rules/`](./.cursor/rules/) | Architecture, frontend, backend, worker, database, API rules |

## Security

- Treat uploads and all external input as untrusted.
- Authorize on the server. Never trust client-side permissions.
- Never log API keys, access tokens, credentials, or signed URLs.
- Do not commit `.env`, keys, or Polar secrets.
- Temporary files expire after about two hours. Presigned upload and download URLs expire after 15 minutes.
- CORS must be an explicit origin list (`API_CORS_ORIGINS`).
