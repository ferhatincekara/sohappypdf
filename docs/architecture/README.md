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
| `apps/admin` | Internal operator console (allowlisted session auth) |

Admin is not a customer product. Access is fail-closed via `ADMIN_USER_IDS` / `ADMIN_EMAILS`. Mutating admin actions (currently credit adjustments) are written to `admin_audit_events`.

## Live packages

| Package | Role |
|---------|------|
| `@repo/core` | App errors, server-only guard |
| `@repo/config` | Env / retention / limits config |
| `@repo/logger` | Structured logging |
| `@repo/utils` | Shared utilities (sparse) |
| `@repo/db` | Drizzle schema + Neon client |
| `@repo/auth` | Better Auth + anonymous sessions |
| `@repo/storage` | S3 abstraction |
| `@repo/queue` | BullMQ queues/workers |
| `@repo/rate-limit` | Upstash rate limiting |
| `@repo/files` | Temporary file domain |
| `@repo/conversions` | Processing jobs / conversion domain |
| `@repo/conversion-engines` | Native/engine runners |
| `@repo/billing` | Polar + entitlements + credit ledger |
| `@repo/api-keys` | API key lifecycle |
| `@repo/tools` | Public tool catalog + credit pricing |
| `@repo/typescript-config` | Shared TS configs |

Shared UI currently lives under `apps/web/components/ui` (shadcn). There is no `@repo/ui`, `@repo/validation`, or `@repo/api-client` package yet.

## Docs

- `docs/api/` — public API contract (OpenAPI + markdown)
- `docs/architecture/` — this overview
- `docs/architecture/tool-ecosystem-audit.md` — catalog vs engine vs UX matrix
