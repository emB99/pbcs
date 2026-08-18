"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/actions/auth";
import { FieldGroup } from "@/components/ui/FieldGroup";
import { IconField } from "@/components/ui/IconField";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {
    status: "idle",
  });

  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-3 text-center">
        <h2 className="font-display text-xl font-semibold">Check your email</h2>
        <p className="text-[13px] text-ink-mid">
          If that address has an account, we&apos;ve sent a link to reset the password.
        </p>
        <Link href="/login" className="text-[12.5px] font-semibold text-crust-deep hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold">Reset your password</h2>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <FieldGroup label="Email" htmlFor="email">
        <IconField icon={<Mail />} id="email" name="email" type="email" autoComplete="email" required />
      </FieldGroup>

      {state.status === "error" && <p className="text-xs text-danger">{state.message}</p>}

      <Button type="submit" variant="primary" fullWidth center disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>

      <Link href="/login" className="text-center text-[12.5px] font-semibold text-crust-deep hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}
