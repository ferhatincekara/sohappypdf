import { getPublicApiV1BaseUrl } from "@/config/public-env";
import { pollExample } from "@/features/developer-docs/lib/example-snippets";

export function getMarketingApiExample(): string {
  return pollExample(getPublicApiV1BaseUrl());
}
