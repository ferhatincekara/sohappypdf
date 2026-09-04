"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        void authClient.signIn
          .email({ email, password })
          .then((result) => {
            if (result.error) {
              setError("Unable to sign in with those credentials.");
              return;
            }

            router.replace("/");
            router.refresh();
          })
          .finally(() => {
            setPending(false);
          });
      }}
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 sm:h-10"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 sm:h-10"
        />
      </div>
      {error !== null ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="primary"
        disabled={pending}
        className="h-11 w-full sm:h-10"
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
