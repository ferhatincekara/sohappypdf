# SoHappyPDF

SaaS platform for PDF conversion, PDF manipulation, OCR, file processing, and public API access.

This repository is a Turborepo monorepo managed with Bun.

## Applications

| App | Port | Role |
|-----|------|------|
| `apps/web` | 3000 | Public tools, marketing, and account |
| `apps/api` | 3001 | Public Hono API and Better Auth |
| `apps/admin` | 3002 | Internal operator console |
| `apps/worker` | health 8080 | Conversion and file-cleanup worker |

Admin access is fail-closed. Set `ADMIN_USER_IDS` and/or `ADMIN_EMAILS`. An empty allowlist means nobody is an administrator.

Include the admin origin in `API_CORS_ORIGINS` (for example `http://localhost:3002`). `*` is rejected.

Set `WORKER_HEALTH_URL` if the admin health view should probe the worker.

Apply Drizzle migrations before serving traffic (`bun run db:migrate`). This includes `admin_audit_events` used by the operator audit log.

## Scripts

- `bun run dev` — start web, API, and worker
- `bun run --filter @repo/admin dev` — start the admin console on port 3002
- `bun run build` — build all workspaces
- `bun run lint` — check linting, formatting, and import organization
- `bun run format` — apply Biome formatting, lint fixes, and import organization
- `bun run check-types` / `bun run typecheck` — run TypeScript checks
- `bun run db:generate` — generate Drizzle migrations
- `bun run db:migrate` — apply versioned Drizzle migrations

## Tooling

- Bun
- Turborepo
- TypeScript
- Biome
