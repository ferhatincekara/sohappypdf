import type { Route } from "next";
import { redirect } from "next/navigation";

export function redirectTo(path: string): never {
  redirect(path as Route);
}
