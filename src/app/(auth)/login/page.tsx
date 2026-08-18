"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { signIn } from "@/lib/actions/auth";
import { FieldGroup } from "@/components/ui/FieldGroup";
import { IconField } from "@/components/ui/IconField";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "@/components/auth/GoogleButton";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, undefined);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold">Sign in</h2>

        <FieldGroup label="Email" htmlFor="email">
          <IconField
            icon={<Mail />}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </FieldGroup>

        <FieldGroup label="Password" htmlFor="password">
          <IconField
            icon={<Lock />}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </FieldGroup>

        {state?.error && <p className="text-xs text-danger">{state.error}</p>}

        <Button type="submit" variant="primary" fullWidth center disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>

        <Link
          href="/forgot-password"
          className="text-center text-[12.5px] font-semibold text-crust-deep hover:underline"
        >
          Forgot your password?
        </Link>
      </form>

      <div className="flex items-center gap-3 text-[11px] text-ink-soft">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <GoogleButton />

      <p className="text-center text-[12.5px] text-ink-soft">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-crust-deep hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
