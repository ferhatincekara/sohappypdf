# PDF tool ecosystem audit

Internal matrix of the live catalog against API, worker, engines, and public UX.

Retention: approximately **2 hours** (`FILE_RETENTION_HOURS` / `ANONYMOUS_RETENTION_HOURS`, default 2).

S3 is object storage. Database records expire/clean via the file and conversion cleanup workers. S3 lifecycle is a safety net.

## Shared pipeline (all executable tools)

| Concern | Status |
|---|---|
| Tool catalog | `@sohappypdf/tools` `TOOL_CATALOG` |
| Public routes | `/{toolId}` via `listRegisteredTools()`; planned tools are **not** routed |
| Upload | Presigned S3; anonymous + authenticated APIs |
| Process | `POST` conversion (anon `/v1/anonymous` or authenticated `/v1/conversions`) |
| Worker | BullMQ conversion processor + engine registry |
| Output | Worker writes S3; DB `outputFileId` |
| Download | Short-lived signed URL; ownership checked |
| Recent executions | `RecentExecutions` on public tool pages |
| Expiration | File + conversion `expiresAt` (~2h) |
| Billing | Polar + web/API/AI credit ledgers |
| Rate limits | Upstash; anonymous vs authenticated vs API |
| i18n | `en` + `tr` catalog + `publicTools` |
| UX states | empty / selected / processing / success / error / expired |
| Mobile | sticky action bar exists; editor still desktop-leaning |
| Accessibility | focus rings and labels present; editors need a dedicated pass |

Anonymous UI size/count defaults are read from `@sohappypdf/billing/plans` (`ANONYMOUS_WEB_LIMITS`) so public tools do not hardcode plan numbers. Server anonymous config in `@sohappypdf/config` stays the enforcement source and is aligned with Free file size (20 MiB), 5 files, and 2 h retention.

Authenticated web upload size is enforced by billing `assertCanUploadFile` using `PlanLimits.maxFileSizeBytes`. The process-wide `MAX_UPLOAD_FILE_SIZE` / `NEXT_PUBLIC_MAX_UPLOAD_FILE_SIZE` (default 100 MiB) is a hard ceiling, not a Free-plan allowance.

## Catalog matrix

Legend: **WS** = public workspace kind. **Anon** = `allowsAnonymous`. **Auth** = `requiresAuthentication`. Credits are web / API / AI.

| Tool | Avail | WS | Engine | Anon | Auth | Plans | Credits | Notes |
|---|---|---|---|---|---|---|---|---|
| merge-pdf | live | merge | pdf-manipulate | yes | no | free+pro | 1/1/0 | Dedicated UX |
| split-pdf | live | split | pdf-manipulate | yes | no | free+pro | 1/1/0 | Dedicated UX |
| extract-pages | live | extract | pdf-manipulate | yes | no | free+pro | 1/1/0 | Visual select |
| organize-pdf | live | organize | pdf-manipulate | yes | no | free+pro | 1/1/0 | Page workspace |
| remove-pages | live | remove | pdf-manipulate | yes | no | free+pro | 1/1/0 | Dedicated UX |
| reorder-pages | live | organize | pdf-manipulate | yes | no | free+pro | 1/1/0 | Same UX as organize |
| rotate-pdf | live | rotate | pdf-manipulate | yes | no | free+pro | 1/1/0 | One angle for selection |
| crop-pdf | live | crop | pdf-manipulate | yes | no | free+pro | 2/2/0 | Uniform margins, all pages |
| compress-pdf | live | compress | pdf-manipulate | yes | no | free+pro | 2/2/0 | Extreme/Recommended/Less |
| repair-pdf | live | repair | pdf-repair | yes | no | free+pro | 2/2/0 | Single job; staged copy |
| pdf-to-pdfa | live | convert | pdf-pdfa | yes | no | free+pro | 5/5/0 | Shared convert shell |
| pdf-to-word | live | convert | office | yes | no | free+pro | 5/5/0 | |
| pdf-to-word-ocr | live | convert | office-ocr | no | yes | free+pro | 10/12/0 | |
| pdf-to-powerpoint | live | convert | office | yes | no | free+pro | 5/5/0 | |
| pdf-to-excel | live | convert | office | yes | no | free+pro | 5/5/0 | |
| pdf-to-excel-ocr | live | convert | office-ocr | no | yes | free+pro | 10/12/0 | |
| pdf-to-jpg | live | convert | pdf-image | yes | no | free+pro | 1/1/0 | |
| pdf-to-png | live | convert | pdf-image | yes | no | free+pro | 1/1/0 | |
| pdf-to-txt | live | convert | pdf-text | yes | no | free+pro | 1/1/0 | |
| word-to-pdf | live | convert | office | yes | no | free+pro | 2/2/0 | |
| powerpoint-to-pdf | live | convert | office | yes | no | free+pro | 2/2/0 | |
| excel-to-pdf | live | convert | office | yes | no | free+pro | 2/2/0 | |
| office-to-pdf | live | convert | office | yes | no | free+pro | 2/2/0 | Mixed office input |
| jpg-to-pdf | live | imageToPdf | image-pdf | yes | no | free+pro | 1/1/0 | Single image; native size |
| png-to-pdf | live | imageToPdf | image-pdf | yes | no | free+pro | 1/1/0 | Single image; native size |
| image-to-pdf | **planned** | — | — | no | yes | free+pro | 1/1/0 | Multi-image + webp; **no route** |
| edit-pdf | live | edit | pdf-edit | no | yes | free+pro | 5/5/0 | Overlay only; no content-stream edit |
| watermark-pdf | live | watermark | pdf-edit | yes | no | free+pro | 1/1/0 | Text + opacity; centered −45° |
| page-numbers-pdf | live | default | pdf-edit | yes | no | free+pro | 1/1/0 | Options panel only |
| protect-pdf | live | protect | pdf-security | no | yes | free+pro | 2/2/0 | |
| unlock-pdf | live | unlock | pdf-security | no | yes | free+pro | 2/2/0 | |
| sign-pdf | live | sign | pdf-edit | no | yes | free+pro | 5/5/0 | Visual stamp; no rotation API |
| redact-pdf | live | default | pdf-redact | no | yes | free+pro | 5/6/0 | Needs visual regions UX |
| compare-pdf | live | default | pdf-compare | no | yes | free+pro | 5/5/0 | Two PDFs; txt output |
| pdf-forms | live | fill | pdf-forms | no | yes | free+pro | 5/5/0 | Existing AcroForm only |
| web-to-pdf | **planned** | — | — | no | yes | free+pro | 2/3/0 | No `web-capture` engine |
| scan-to-pdf | live | default | image-pdf | no | yes | free+pro | 2/2/0 | Multi image; generic UX |
| pdf-extract | live | default | pdf-extract | no | yes | free+pro | 10/12/0 | txt/json; generic UX |
| pdf-to-markdown | live | convert | pdf-markdown | no | yes | free+pro | 5/5/0 | |
| ocr-pdf | live | ocr | ocr | no | yes | free+pro | 5/5/0 | Searchable PDF or text |
| ai-summarizer | live | default | ai | no | yes | **pro** | 0/0/10 | AI credits |
| translate-pdf | live | default | ai | no | yes | **pro** | 0/0/10 | AI credits |

Every **live** row has: catalog definition, `/v1` conversion type of the same id, worker engine, upload validation, output validation, expiration, success/error/expired tool states, i18n name+description.

## Missing product capabilities (do not fake)

| Capability | Why skipped |
|---|---|
| Flatten PDF (standalone) | Only `pdf-forms` `{ flatten: true }` after fill |
| Resize PDF | No conversion type |
| Annotate PDF (standalone) | No `annotate-pdf` type; highlight/text/shape exist on Edit PDF |
| PDF metadata editor | No type |
| PDF to HTML / HTML to PDF | No type |
| Webpage to PDF | Catalog `web-to-pdf` is planned |
| Multi-image / WebP → PDF | Catalog `image-to-pdf` is planned; jpg/png tools are single-file |
| OCR image (standalone) | Conversion type `ocr-image` exists but `implemented: false` and **no engine** |
| Image watermark, per-page crop, signature rotation | Backend options do not support them |
| Edit existing PDF text | Overlay stamps only |
| Fill radio / create form widgets | Engine fills text, checkbox, dropdown only |

## Default-workspace tools with a real backend

These process end-to-end but still use `DefaultToolWorkspace` (generic upload + options):

- `page-numbers-pdf`
- `redact-pdf` (regions must be supplied; visual redact UX missing)
- `compare-pdf`
- `scan-to-pdf`
- `pdf-extract`
- `ai-summarizer`
- `translate-pdf`

Do not claim a dedicated visual experience until one exists.

## Inconsistencies noted

1. Public copy still said “workspace” / “conversion job” in a few strings (fixed in this audit pass).
2. Recent executions store status `completed`; product language should say **Ready**.
3. Anonymous/Free file size is 20 MiB from the plan catalog; authenticated public tools use billing `limits.maxFileSizeBytes`.
4. Legacy `/app/*` URLs redirect to `/account/*`.
5. Default-workspace tools still lack dedicated visual UX (see list above).
6. `jpg-to-pdf` / `png-to-pdf` were listed in convert-tool ids even though the image workspace wins (cleaned up).

## Follow-ups

- Stuck-processing sweeper beyond queue retries
- Safe job retry only if enqueue stays idempotent
- Dedicated UX for redact / compare / scan / extract / AI tools
- Standalone annotate / flatten / resize when engines exist
- Browser e2e (Playwright) when a runner is added
