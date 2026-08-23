# Worker-only image. Native conversion binaries stay here, never in apps/api.
# Required tools: LibreOffice (soffice), Poppler (pdftoppm, pdftotext), Ghostscript (gs).
# Build from the repository root:
#   docker build -f apps/worker/Dockerfile -t sohappypdf-worker .
ARG BUN_VERSION=1.3.14

FROM oven/bun:${BUN_VERSION}-debian AS pruner
WORKDIR /app
COPY package.json bun.lock turbo.json ./
COPY apps/worker ./apps/worker
COPY packages ./packages
RUN bunx turbo@2.10.11 prune @repo/worker --docker

FROM oven/bun:${BUN_VERSION}-debian AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock
COPY --from=pruner /app/out/full/turbo.json ./turbo.json
RUN bun install --frozen-lockfile
COPY --from=pruner /app/out/full/ .

FROM oven/bun:${BUN_VERSION}-debian AS runner
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    ghostscript \
    libreoffice-writer \
    poppler-utils \
  && rm -rf /var/lib/apt/lists/* \
  && soffice --version \
  && pdftoppm -v \
  && pdftotext -v \
  && gs --version

WORKDIR /app
COPY --from=installer /app /app

ENV NODE_ENV=production
ENV HOME=/tmp
ENV WORKER_HEALTH_PORT=8080

RUN mkdir -p /tmp/sohappypdf-worker \
  && chown -R bun:bun /tmp/sohappypdf-worker

USER bun
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||process.env.WORKER_HEALTH_PORT||'8080')+'/ready').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

WORKDIR /app/apps/worker
CMD ["bun", "run", "src/index.ts"]
