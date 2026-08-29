# SoHappyPDF

SaaS platform for PDF conversion, PDF manipulation, OCR, file processing, and public API access.

This repository is a Turborepo monorepo managed with Bun.

## Applications

| App | Port | Role |
|-----|------|------|
| `apps/web` | 3000 | Public tools, marketing, and account |
| `apps/api` | 3001 | Public Hono API and Better Auth |
| `apps/worker` | health 8080 | Conversion and file-cleanup worker |

CORS cannot be `*`. Set `API_CORS_ORIGINS` to the web origin (for example `http://localhost:3000`).

Apply Drizzle migrations before serving traffic (`bun run db:migrate`).

## Scripts

- `bun run dev` — start web, API, and worker
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
