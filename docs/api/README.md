# SoHappyPDF API

Public developer contract for SoHappyPDF **v1**.

The HTTP API is versioned as `/api/v1`. That prefix is stable. Breaking changes require a new version.

## Read these first

1. [v1 reference](./v1.md) — authentication, files, conversions, errors, rate limits, and plans
2. [End-to-end workflow](./examples/workflow.sh) — upload, convert, poll, download
3. [OpenAPI](./openapi.json) — machine-readable contract, also served at `GET /api/v1/openapi.json`

## Canonical workflow

```
API key
  → authenticate
  → upload file (presigned PUT)
  → complete upload
  → create conversion
  → poll conversion
  → download result
```

## What this directory is not

- Not a documentation application (`apps/docs` does not exist)
- Not an SDK
- Not a webhook catalog — developer webhooks are a future extension

Future documentation apps should consume `openapi.json` and this folder rather than inventing a second contract.
