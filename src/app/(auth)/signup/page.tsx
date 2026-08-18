"use client";

import { useActionState } from "react";
import Link from "next/link";
import { User, Mail, Lock } from "lucide-react";
import { signUp } from "@/lib/actions/auth";
import { FieldGroup } from "@/components/ui/FieldGroup";
import { IconField } from "@/components/ui/IconField";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "@/components/auth/GoogleButton";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUp, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-3 text-center">
        <h2 className="font-display text-xl font-semibold">Check your email</h2>
        <p className="text-[13px] text-ink-mid">
          We&apos;ve sent a confirmation link. Click it to finish creating your account.
        </p>
        <Link href="/login" className="text-[12.5px] font-semibold text-crust-deep hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold">Create an account</h2>

        <FieldGroup label="Full name" htmlFor="fullName">
          <IconField icon={<User />} id="fullName" name="fullName" autoComplete="name" required />
        </FieldGroup>

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
            autoComplete="new-password"
            required
          />
        </FieldGroup>

        {state.status === "error" && <p className="text-xs text-danger">{state.message}</p>}

        <Button type="submit" variant="primary" fullWidth center disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-[11px] text-ink-soft">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <GoogleButton />

      <p className="text-center text-[12.5px] text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-crust-deep hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
