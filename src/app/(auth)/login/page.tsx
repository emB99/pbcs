"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold">Sign in</h2>

      <FieldGroup label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </FieldGroup>

      <FieldGroup label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </FieldGroup>

      {state?.error && <p className="text-xs text-danger">{state.error}</p>}

      <Button type="submit" variant="primary" fullWidth disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <Link
        href="/forgot-password"
        className="text-center text-[12.5px] font-semibold text-crust-deep hover:underline"
      >
        Forgot your password?
      </Link>
    </form>
  );
}
