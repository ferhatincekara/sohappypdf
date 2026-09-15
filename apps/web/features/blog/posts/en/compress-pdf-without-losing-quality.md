---
slug: compress-pdf-without-losing-quality
title: "How to get a PDF under 1 MB without wrecking it"
description: "Compress for email and uploads without flattening every image. Choose a level, watch photos vs text, and download before the file expires."
date: "2026-08-14"
author: Ferhat İncekara
role: Founder
cover: /images/blog/compress-pdf-without-losing-quality.jpg
coverAlt: "A laptop showing a document next to a coffee cup"
toolHref: /compress-pdf
---

Most “make this smaller” emergencies are email limits, form uploads, and chat apps that reject anything over a few megabytes. You do not always need a 200 KB file. You need a file that still looks like the original when someone opens it on a phone.

[Compress PDF](/compress-pdf) has three levels: `low`, `medium`, and `high`. Start in the middle. Jump to high only if the first pass is still too large.

## What actually makes a PDF heavy

- Full-page photos and scans at camera resolution
- Embedded fonts you do not need
- Pages that were exported from a slide deck at 300 DPI
- A file that was already compressed, then exported again from a desktop app

Text-heavy contracts rarely need heroic compression. Image-heavy pitch decks do.

## Pick a level on purpose

- **Low** keeps more image detail. Use it for print-adjacent work or photos of signatures you still need to read.
- **Medium** is the default. It is the right first try for email.
- **High** is for hard caps (many portals still say “under 1 MB”). Proof the result. Zoom into photos and small type before you send it.

If high still misses the cap, you are usually fighting a scan. Run [Compress PDF](/compress-pdf) after [OCR PDF](/ocr-pdf) only when you also need searchable text — OCR does a different job. Compression does not add a text layer.

## Do not loop the same file forever

Each run is an operation. Anonymous and Free accounts get 5 per day. Re-compressing a file that is already small often costs quality and does not save meaningful bytes. Keep the original. Compress once. If it fails the cap, extract the pages you actually need with [Extract pages](/extract-pages) and compress that subset.

Free also caps you at 25 MB inbound and 50 pages. A 60-page scan will not start. Pro raises the file cap to 1 GB and removes the page cap.

## Check the output like a designer

Open the result and look at:

1. Logos on the first page
2. Small footnotes
3. Photos of people or products
4. Tables with thin rules

If those four still read, the file is done. If type falls apart, step back to `medium` and drop unused pages instead.

## API notes

`POST /conversions` with `"type": "compress-pdf"`, `"targetFormat": "pdf"`, and `"options": { "level": "medium" }`. Poll until `completed`, then download. Files still expire after about two hours — persist the result in your own storage if the user needs it later.

## A short recipe

1. Keep the original.
2. Compress at `medium`.
3. If the portal still rejects it, try `high` once.
4. If it is still huge, extract the pages that matter and compress those.

That sequence gets most decks under 1 MB without turning every photo into noise.
