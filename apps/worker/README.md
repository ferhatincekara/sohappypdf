# Conversion worker

Long-running conversion consumer for SoHappyPDF.

The API (`apps/api`) stays independently deployable, including on Vercel. This worker is the compute environment. Deploy it as a container to Railway, Google Cloud Run, or any similar platform.

## Startup

```
container starts
  → load configuration
  → initialize logger
  → verify native binaries
  → ping database, queue, and S3
  → start health listener
  → start BullMQ worker
  → consume jobs
  → graceful shutdown
```

Missing configuration or a missing required binary fails startup. The process does not start half-configured.

## Native binaries

The worker image installs only tools used by implemented engines:

| Binary | Package | Used for |
|---|---|---|
| `soffice` | LibreOffice Writer | PDF → DOCX |
| `pdftoppm` | Poppler | PDF → JPG/PNG |
| `pdftotext` | Poppler | PDF → TXT |
| `gs` | Ghostscript | PDF compress |

ImageMagick is not installed. Image → PDF uses `pdf-lib`.

## Environment

Required:

- `DATABASE_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`

Optional:

| Variable | Default | Purpose |
|---|---|---|
| `WORKER_CONCURRENCY` | `1` | Jobs processed at once |
| `CONVERSION_TIMEOUT_MS` | `120000` | Native conversion timeout |
| `WORKER_SHUTDOWN_TIMEOUT_MS` | timeout + 10s | Graceful shutdown wait |
| `WORKER_HEALTH_PORT` | `8080` | Health listener |
| `PORT` | health port | Cloud Run listen port |
| `MAX_INPUT_FILE_SIZE` | 100MB | Downloaded source limit |
| `MAX_OUTPUT_FILE_SIZE` | 150MB | Output limit |
| `MAX_TEMP_DISK_USAGE` | 512MB | Workspace disk limit |

Do not log these values. Binary names (`LIBREOFFICE_BIN`, `GHOSTSCRIPT_BIN`, `PDFTOPPM_BIN`, `PDFTOTEXT_BIN`) may be overridden with a basename only.

## Concurrency

Default concurrency is **1**.

LibreOffice, Ghostscript, and large PDFs are CPU- and memory-heavy. Raising concurrency increases throughput and also increases RAM, CPU, and `/tmp` usage. Start at 1 and raise only after measuring a specific instance size.

## Timeouts

Every conversion has a maximum execution time (`CONVERSION_TIMEOUT_MS`). The process runner terminates the child with SIGTERM, then SIGKILL. Timeouts are permanent conversion failures so a malformed file does not burn retry budget.

## Retries

Queue settings in `@repo/queue`:

- 5 attempts
- exponential backoff starting at 2 seconds (2s, 4s, 8s, 16s, 32s)
- completed jobs retained 24 hours / 200 jobs
- failed jobs retained 7 days / 1000 jobs

Permanent failures (`PermanentConversionError`, validation, not found, conflict) become BullMQ `UnrecoverableError` and do not retry.

Transient failures (S3/network/internal) retry.

## Health

The worker is not an API. It exposes a small HTTP listener for platforms that require a port.

| Path | Meaning |
|---|---|
| `/` or `/live` | Process is alive |
| `/ready` or `/health` | Configuration loaded, binaries present, infrastructure reachable, worker started |

Responses are `{"status":"..."}` only. They do not include credentials, environment variables, or infrastructure details.

Readiness returns 503 while starting or shutting down.

## Graceful shutdown

On `SIGTERM` or `SIGINT`:

1. Stop accepting new jobs
2. Allow the active conversion to finish, up to `WORKER_SHUTDOWN_TIMEOUT_MS`
3. Force-close if the timeout is exceeded
4. Close the health listener and Redis connections
5. Exit

Neon HTTP has no persistent connection pool to close.

## Resource starting point

Safe initial production size for the current engines:

- 2 vCPU
- 2–4 GB RAM
- concurrency 1
- conversion timeout 120s
- platform SIGTERM grace ≥ shutdown timeout (130s if using defaults)
- 5 queue attempts with exponential backoff

LibreOffice can exceed 1 GB on a large document. Prefer more RAM over higher concurrency.

## Railway

Run this image as a long-running service. Set the required environment variables. Optional HTTP health check: `/ready` on `WORKER_HEALTH_PORT` (default 8080). CPU is available for the life of the container, which is the correct model for a queue worker.

## Cloud Run

Use a **service** with:

- CPU always allocated
- minimum instances ≥ 1
- request/instance timeout ≥ conversion timeout
- container listen port = `PORT`

Cloud Run's default “CPU only during requests” model will not process Redis jobs. Do not run this worker as a request-driven service without always-on CPU.

Deployment files for a specific provider stay outside application code.

## Docker

From the repository root:

```sh
docker build -f apps/worker/Dockerfile -t sohappypdf-worker .
```

The image runs as the non-root `bun` user. Temporary files live under `/tmp/sohappypdf-worker` and are removed after every job.

## File cleanup

The same worker process also consumes the `file-cleanup` queue.

On startup it registers a repeatable BullMQ job (`cleanup-expired`) every 2 hours and runs one pass immediately. The job is empty: the worker deletes expired conversion rows, removes the matching S3 objects, then hard-deletes the file rows in batches of 100.

Cleanup is eventually consistent. Files become inaccessible at `expiresAt` even if the S3 object is still present. Physical deletion happens on the next successful cleanup run.

Default retention is 2 hours (`FILE_RETENTION_HOURS`). Changing that value updates `expiresAt` for newly created source and output files. Existing rows keep the timestamp written at create time.

### S3 lifecycle safety net

Do not configure the bucket to delete every object after 2 hours. Application `expiresAt` is authoritative, and future plans may use longer retention.

A safe infrastructure fallback is an S3 lifecycle rule scoped to the `files/` prefix that expires objects after **7 days**. That only covers orphans the application never recorded or failed to delete. It is not a substitute for the cleanup job.

Full bucket reconciliation is not implemented. Object keys are `files/{fileId}/original` and `files/{fileId}/output/{conversionId}`, so every upload creates a database row first. Abandoned uploads expire with that row.

## Limitations

- There is no OS-level sandbox beyond argument-array process execution, allowlisted binaries, size limits, and job-scoped temp directories.
- If the process dies after `processing` starts and before complete/fail, the row can stay `processing` until the job is retried. Duplicate delivery is idempotent: completed conversions and existing output objects are not converted again.
- Native integration tests are skipped when binaries are missing on a developer machine. The container image must include them.
