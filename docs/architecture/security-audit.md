# Security audit

Internal review of anonymous sessions, authz, uploads, downloads, API keys, and workers.

This document does **not** claim PDF malware risk is solved.

## Controls in place

- File access and executions are owner-scoped (`requireOwnedAccessibleFile`, conversion owner checks).
- Expired owned downloads return a product-level 410, not infrastructure details.
- Presigned upload/download URLs default to **15 minutes** and cannot exceed **1 hour**.
- Object keys are generated server-side from UUID segments; path traversal in keys is rejected.
- Original filenames cannot contain `/` or `\\`; download `Content-Disposition` is sanitized.
- Declared MIME types are not enough: complete-upload compares S3 object metadata and size.
- File size limits are enforced server-side (anonymous config, plan entitlements, storage byte limit).
- API keys are hashed at rest; the raw secret is returned once. Logs redact `apiKey`, tokens, passwords, and signed URL query strings.
- CORS cannot be `*`. Anonymous, session, and API-key rate limits are separate.
- Conversion job payloads strip secret-like option keys before queue persistence.
- Worker temp workspaces reject user-controlled path traversal.
- There is no operator console in this revision. Privileged account changes stay out of the public API.
- Password reset mail goes through Resend. Reset URLs and tokens are not logged. Delivery failures do not reveal whether an account exists.

## Residual risks

- Malicious PDFs can still consume CPU/memory or trigger engine bugs. Isolation is process/workspace based, not a full sandbox VM.
- MIME sniffing is limited; we verify size and declared type against stored object metadata, not a complete file-format allowlist for every engine.
- Presigned URLs are bearer capabilities while they live. Keep them short and never log them.
- Anonymous sessions are abuse-limited, not identity-proof. Rate limits and file-size caps are the primary control.
- Queue retries are not offered because conversion enqueue is not guaranteed idempotent for every tool.
- Authenticated upload still has a process-wide ceiling (`MAX_UPLOAD_FILE_SIZE`, default 100 MiB) in addition to plan limits. Plan limits are enforced first.
