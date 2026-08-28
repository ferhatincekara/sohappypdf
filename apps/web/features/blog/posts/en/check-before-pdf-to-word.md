---
slug: check-before-pdf-to-word
title: "Five checks before you convert a contract to Word"
description: "A short pre-flight for PDF to Word so layout, scans, and passwords do not surprise you after the job finishes."
date: "2026-08-02"
author: Ferhat İncekara
role: Founder
cover: /images/blog/check-before-pdf-to-word.jpg
coverAlt: "A printed contract on a desk next to a laptop"
toolHref: /pdf-to-word
---

Converting a contract to Word is usually the right move when you need to edit clauses, leave comments, or send a redline. It is the wrong move when the PDF is a scan, locked, or already a one-way archive. Run these five checks first. They take a minute and save a second upload.

## 1. Decide if the file is text or a scan

Open the PDF and try to select a sentence. If the cursor highlights real text, [PDF to Word](/pdf-to-word) can rebuild an editable `.docx`. If you can only draw a box around the page, the file is an image of a document. That path needs OCR.

OCR is a Pro tool: [PDF to Word OCR](/pdf-to-word-ocr). Free and anonymous sessions will be asked to upgrade. Do not run the standard converter on a scan and expect clean paragraphs. You will get a page-shaped picture inside Word.

## 2. Unlock the file before you convert

Password-protected PDFs fail in the converter. If the upload is locked, open [Unlock PDF](/unlock-pdf) with the known password, download the unlocked copy, then convert. Do not paste passwords into chat logs or tickets. The API option field is `password` on unlock and protect tools; treat it as a secret.

If you do not have the password, conversion cannot invent one.

## 3. Check size, pages, and the plan you are on

Anonymous and Free use is 5 operations per day, 25 MB per file, one file at a time, and 50 pages per file. Pro removes the operation and page caps and raises the file limit to 1 GB.

A 40-page scanned contract on Free will stop at the page cap even if the file is small. Split it with [Split PDF](/split-pdf) or [Extract pages](/extract-pages) if you only need the signature block, or upgrade if you need the whole pack.

## 4. Know what layout you are willing to rebuild

PDF to Word preserves structure better when the source has real text, simple tables, and a single column. Complex brochures, multi-column term sheets, and heavy vector letterheads still convert, but expect to tidy styles in Word. That is normal. The converter is a starting point, not a print-ready replica of every design file.

If you only need to read the text, [PDF to TXT](/pdf-to-txt) is a cheaper, simpler job.

## 5. Download before the file expires

Uploads and results are temporary. Files expire after about two hours. The tool page is not a document library. Convert, download the `.docx`, and keep the source PDF in your own store.

If you are wiring this into a product, the same sequence is the public API: presign an upload, `PUT` the bytes, complete the file, `POST /conversions` with `"type": "pdf-to-word"` and `"targetFormat": "docx"`, then poll until `completed` and download `outputFileId`. Scanned contracts use `"type": "pdf-to-word-ocr"` with a `language` option such as `eng` or `tur`.

## A practical order of operations

1. Confirm text vs scan.
2. Unlock if needed.
3. Confirm the file is within your plan limits.
4. Run [PDF to Word](/pdf-to-word) or [PDF to Word OCR](/pdf-to-word-ocr).
5. Download the `.docx` the same session.

That is the whole pre-flight. Skip a step and you will usually find out after the worker has already spent the operation.
