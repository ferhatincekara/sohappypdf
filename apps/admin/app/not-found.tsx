import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { AuthShell } from "@/features/auth/auth-shell";
import { cn } from "@/lib/utils";

export default function NotFoundPage() {
  return (
    <AuthShell
      title="Page not found"
      description="That admin route does not exist, or the resource is no longer available."
    >
      <Link href="/" className={cn(buttonVariants(), "w-full")}>
        Back to overview
      </Link>
    </AuthShell>
  );
}
