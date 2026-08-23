# Build from the repository root:
# docker build -f apps/worker/Dockerfile .
FROM oven/bun:1.3-debian

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    ghostscript \
    libreoffice-writer \
    poppler-utils \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/worker ./apps/worker
COPY packages ./packages

RUN bun install --frozen-lockfile

WORKDIR /app/apps/worker

USER bun

CMD ["bun", "run", "src/index.ts"]
