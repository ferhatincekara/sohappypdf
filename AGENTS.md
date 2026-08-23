# SohappyPDF

## Project

SohappyPDF is a SaaS platform for PDF conversion, PDF manipulation, OCR, file processing, and public API access.

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
- shadcn/ui
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
├── worker/
└── admin/

packages/
├── core/
├── utils/
├── validation/
├── logger/
├── config/
├── db/
├── auth/
├── storage/
├── queue/
├── rate-limit/
├── conversions/
├── billing/
├── api-client/
└── ui/

docs/
├── architecture/
├── api/
└── decisions/

## Applications

### web

Customer-facing Next.js application.

### api

Public Hono API.

### worker

Background PDF conversion and file processing worker.

### admin

Internal administration application.

## Package Responsibilities

- `core`: Shared domain primitives
- `utils`: Generic reusable utilities
- `validation`: Shared Zod validation
- `logger`: Structured logging
- `config`: Environment configuration
- `db`: Drizzle ORM and database schema
- `auth`: Better Auth
- `storage`: AWS S3 abstraction
- `queue`: BullMQ
- `rate-limit`: Upstash rate limiting
- `conversions`: Conversion definitions and contracts
- `billing`: Polar.sh integration
- `api-client`: Shared Axios client
- `ui`: Shared shadcn/ui components

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
