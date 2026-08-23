import { APP_PATHS } from "@/features/app-shell";

export function conversionPath(id: string): string {
  return `${APP_PATHS.conversions}/${id}`;
}
