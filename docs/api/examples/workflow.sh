#!/usr/bin/env bash
# Canonical SoHappyPDF v1 workflow.
# Replace API_BASE and YOUR_API_KEY. Do not commit real keys.

set -euo pipefail

API_BASE="${API_BASE:-http://localhost:3001}"
API_KEY="${API_KEY:-YOUR_API_KEY}"
SOURCE_FILE="${SOURCE_FILE:-./report.pdf}"

auth_header="Authorization: Bearer ${API_KEY}"
size="$(wc -c < "${SOURCE_FILE}" | tr -d ' ')"

intent="$(
  curl -sS -X POST "${API_BASE}/api/v1/files/upload" \
    -H "${auth_header}" \
    -H "Content-Type: application/json" \
    -d "{\"filename\":\"report.pdf\",\"contentType\":\"application/pdf\",\"size\":${size}}"
)"

file_id="$(printf '%s' "${intent}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["file"]["id"])')"
upload_url="$(printf '%s' "${intent}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["upload"]["url"])')"
content_type="$(printf '%s' "${intent}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["upload"]["headers"]["Content-Type"])')"

curl -sS -X PUT "${upload_url}" \
  -H "Content-Type: ${content_type}" \
  --data-binary "@${SOURCE_FILE}"

curl -sS -X POST "${API_BASE}/api/v1/files/${file_id}/complete" \
  -H "${auth_header}"

created="$(
  curl -sS -X POST "${API_BASE}/api/v1/conversions" \
    -H "${auth_header}" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: example-pdf-to-png-1" \
    -d "{\"sourceFileId\":\"${file_id}\",\"targetFormat\":\"png\",\"type\":\"pdf-to-png\"}"
)"

conversion_id="$(printf '%s' "${created}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["conversion"]["id"])')"

while true; do
  status_json="$(curl -sS "${API_BASE}/api/v1/conversions/${conversion_id}" -H "${auth_header}")"
  status="$(printf '%s' "${status_json}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["conversion"]["status"])')"

  if [ "${status}" = "completed" ]; then
    output_file_id="$(printf '%s' "${status_json}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["conversion"]["outputFileId"])')"
    break
  fi

  if [ "${status}" = "failed" ] || [ "${status}" = "cancelled" ]; then
    printf '%s\n' "${status_json}"
    exit 1
  fi

  sleep 2
done

download="$(
  curl -sS -X POST "${API_BASE}/api/v1/files/${output_file_id}/download" \
    -H "${auth_header}"
)"

download_url="$(printf '%s' "${download}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["download"]["url"])')"
curl -sS -L "${download_url}" -o result.png

curl -sS -X DELETE "${API_BASE}/api/v1/files/${file_id}" \
  -H "${auth_header}"
