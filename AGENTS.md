# SohappyPDF

## Project

SohappyPDF is a tool-first SaaS PDF platform: public PDF tools, temporary file processing, OCR, and a public API.

The project is a Turborepo monorepo.

Use feature-based architecture throughout the project.

Detailed architecture and implementation rules are defined in `.cursor/rules/`.

## Technology Stack

### Core

- TypeScript
- Bun
- Turborepo
- Biome

### Frontend

- Next.js
- React
- React Query
- Axios
- React Hook Form
- Zod
- shadcn/ui (in `apps/web/components/ui`)
- next-intl

### Backend

- Hono
- Better Auth
- Drizzle ORM
- Neon PostgreSQL

### Infrastructure

- AWS S3
- Upstash Redis
- BullMQ
- Docker

### Billing

- Polar.sh

Stripe must not be used.

Sentry is not used.

## Monorepo

apps/
├── web/
├── api/
└── worker/

packages/
├── core/
├── utils/
├── logger/
├── config/
├── db/
├── auth/
├── storage/
├── queue/
├── rate-limit/
├── files/
├── conversions/
├── conversion-engines/
├── billing/
├── api-keys/
├── tools/
├── ai/
└── typescript-config/

docs/
├── architecture/
└── api/

## Applications

### web

Customer-facing Next.js application.

Primary product surface: public tool pages (anonymous-friendly).

Secondary surface: authenticated account area at `/account` (usage, billing, API, settings, recent activity).

### api

Public Hono API.

### worker

Background PDF conversion and file processing worker.

### admin

Not present yet. Do not create it unless explicitly requested.

## Package Responsibilities

- `core`: Shared domain primitives and application errors
- `utils`: Generic reusable utilities (organized by purpose)
- `logger`: Structured logging
- `config`: Environment configuration
- `db`: Drizzle ORM and database schema
- `auth`: Better Auth and anonymous sessions
- `storage`: AWS S3 abstraction
- `queue`: BullMQ
- `rate-limit`: Upstash rate limiting
- `files`: Temporary file domain
- `conversions`: Processing job / conversion domain
- `conversion-engines`: Native conversion engines
- `billing`: Polar.sh integration, entitlements, credit ledger
- `api-keys`: API key lifecycle
- `tools`: Public tool catalog and credit pricing
- `ai`: AI provider abstraction
- `typescript-config`: Shared TypeScript configs

## Product Principles

- Tool pages own the end-to-end operation UX.
- Anonymous users can use anonymous-allowed tools without an account.
- Authentication unlocks higher limits, history, billing, and API access.
- The account area is not a file-management dashboard.
- Files are temporary (~2 hours). Do not build a permanent document library for normal tool usage.
- Web credits are the primary authenticated web usage meter.
- Anonymous usage may rely on rate/daily limits without a full credit account.
- Do not present storage quota as a Free/Pro product differentiator.

## Global Rules

### Package Manager

Use Bun only.

Never use:

- npm
- pnpm
- yarn

### TypeScript

- Strict mode is required.
- Never use `any`.
- Prefer `unknown` when the type is genuinely unknown.
- Prefer `const`.
- Use `let` only when reassignment is necessary.
- Never use `var`.

### Code Style

- Use Biome for formatting and linting.
- Use kebab-case for files and directories.
- Use camelCase for variables and functions.
- Use PascalCase for components, classes, and types.
- Prefer readable and explicit code.
- Avoid unnecessary abstractions.
- Avoid duplicated logic.
- Do not refactor unrelated code.

### Architecture

- Use feature-based architecture.
- Keep feature-specific code inside its feature.
- Keep shared code in the appropriate package.
- Do not create generic dumping-ground files such as `utils.ts`, `helpers.ts`, or `common.ts`.
- Do not import application source code from another application.
- Do not import internal source files from another package.
- Avoid circular dependencies.
- Keep infrastructure concerns separated from business logic.

### Reuse

Before creating new utilities, components, services, or abstractions:

1. Search the existing codebase.
2. Check whether an existing implementation can be reused.
3. Only create a new abstraction when it represents a real reusable concept.

Do not duplicate functionality.

### Security

- Never expose secrets to the client.
- Never log secrets, API keys, access tokens, credentials, or signed URLs.
- Validate all external input.
- Enforce authorization server-side.
- Treat uploaded files as untrusted.
- Never execute arbitrary user-provided commands.
- Never expose AWS credentials.
- Never store binary files in PostgreSQL or Redis.

### API

The public API uses Hono.

The initial API version is `/v1`.

API changes must remain backward compatible within the same version.

Long-running conversion work must run asynchronously through BullMQ and the worker.

### Files

AWS S3 is used for file storage.

Large files should use direct browser-to-S3 uploads through presigned URLs.

Temporary files should have a short lifecycle, targeting approximately 2 hours.

S3 lifecycle rules are a secondary safety net for orphans, not the primary user-facing expiration mechanism.

### Plans and Billing

The application has Free and Pro plans.

Polar.sh is used for billing and subscriptions.

Plan entitlements must be enforced server-side.

Do not introduce Stripe.

## Cursor Rules

Detailed rules are defined in:

`.cursor/rules/architecture.mdc`

`.cursor/rules/frontend.mdc`

`.cursor/rules/backend.mdc`

`.cursor/rules/worker.mdc`

`.cursor/rules/database.mdc`

`.cursor/rules/api.mdc`

When working on a specific area, follow the relevant Cursor rule in addition to this document.

## Before Making Changes

Before implementing a feature:

1. Inspect the existing architecture.
2. Search for existing implementations.
3. Identify the correct feature or package.
4. Follow the relevant `.cursor/rules/` file.
5. Reuse existing abstractions where appropriate.
6. Make the smallest clean change.
7. Run Biome and relevant tests.

## Final Principle

Prefer code that is:

- Simple
- Explicit
- Typed
- Reusable
- Secure
- Maintainable

Do not optimize for fewer lines of code.

Optimize for clear ownership and predictable behavior.
