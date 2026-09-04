"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";

export function SignOutButton({ label = "Sign out" }: { label?: string }) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={() => {
        void authClient.signOut().then(() => {
          router.replace("/login");
          router.refresh();
        });
      }}
    >
      {label}
    </Button>
  );
}
