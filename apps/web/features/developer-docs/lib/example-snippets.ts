export function authorizationExample(): string {
  return "Authorization: Bearer YOUR_API_KEY";
}

export function uploadExample(apiV1BaseUrl: string): string {
  return [
    `curl -X POST ${apiV1BaseUrl}/files/upload \\`,
    `  -H "${authorizationExample()}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"filename":"report.pdf","contentType":"application/pdf","size":2048}'`,
  ].join("\n");
}

export function conversionExample(apiV1BaseUrl: string): string {
  return [
    `curl -X POST ${apiV1BaseUrl}/conversions \\`,
    `  -H "${authorizationExample()}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -H "Idempotency-Key: YOUR_IDEMPOTENCY_KEY" \\`,
    `  -d '{"sourceFileId":"FILE_ID","targetFormat":"png","type":"pdf-to-png"}'`,
  ].join("\n");
}

export function pollExample(apiV1BaseUrl: string): string {
  return [
    `curl ${apiV1BaseUrl}/conversions/CONVERSION_ID \\`,
    `  -H "${authorizationExample()}"`,
  ].join("\n");
}

export function downloadExample(apiV1BaseUrl: string): string {
  return [
    `curl -X POST ${apiV1BaseUrl}/files/OUTPUT_FILE_ID/download \\`,
    `  -H "${authorizationExample()}"`,
  ].join("\n");
}
