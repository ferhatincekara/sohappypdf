"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function AdminSignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  return (
    <button
      type="button"
      disabled={isSigningOut}
      className="text-sm text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
      onClick={() => {
        setIsSigningOut(true);
        void authClient.signOut().then(() => {
          router.replace("/login");
          router.refresh();
        });
      }}
    >
      {isSigningOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
