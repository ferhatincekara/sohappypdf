# Architecture

This folder documents the live monorepo shape. Prefer this over outdated package lists in older notes.

## Product direction

SoHappyPDF is a **tool-first** PDF platform.

- Primary UX: public tool pages (anonymous-friendly), e.g. `/merge-pdf`
- Secondary UX: authenticated **account** area (`/account`) for usage, billing, API, settings, and recent activity
- Files are temporary processing assets (~2 hours), not a permanent library

## Live applications

| App | Role |
|-----|------|
| `apps/web` | Next.js customer app (marketing, tools, account) |
| `apps/api` | Hono public API + Better Auth |
| `apps/worker` | BullMQ conversion + cleanup worker |
| `apps/admin` | Internal operations console (administrator-only) |

## Live packages

| Package | Role |
|---------|------|
| `@sohappypdf/core` | App errors, server-only guard |
| `@sohappypdf/config` | Env / retention / limits config |
| `@sohappypdf/logger` | Structured logging |
| `@sohappypdf/utils` | Shared utilities (sparse) |
| `@sohappypdf/db` | Drizzle schema + Neon client |
| `@sohappypdf/auth` | Better Auth + anonymous sessions |
| `@sohappypdf/storage` | S3 abstraction |
| `@sohappypdf/queue` | BullMQ queues/workers |
| `@sohappypdf/rate-limit` | Upstash rate limiting |
| `@sohappypdf/files` | Temporary file domain |
| `@sohappypdf/conversions` | Processing jobs / conversion domain |
| `@sohappypdf/conversion-engines` | Native/engine runners |
| `@sohappypdf/billing` | Polar + entitlements + credit ledger |
| `@sohappypdf/api-keys` | API key lifecycle |
| `@sohappypdf/tools` | Public tool catalog + credit pricing |
| `@sohappypdf/typescript-config` | Shared TS configs |

Shared UI currently lives under `apps/web/components/ui` (shadcn). There is no `@sohappypdf/ui`, `@sohappypdf/validation`, or `@sohappypdf/api-client` package yet.

## Docs

- `docs/api/` — public API contract (OpenAPI + markdown)
- `docs/architecture/` — this overview
- `docs/architecture/tool-ecosystem-audit.md` — catalog vs engine vs UX matrix
