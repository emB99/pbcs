"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { Button } from "@/components/ui/Button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = resetPasswordSchema.safeParse({ password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid password.");
      return;
    }

    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    setPending(false);

    if (updateError) {
      setError("That reset link has expired. Request a new one.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1200);
  }

  if (done) {
    return (
      <div className="text-center">
        <h2 className="font-display text-xl font-semibold">Password updated</h2>
        <p className="mt-1 text-[13px] text-ink-mid">Taking you to the dashboard…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold">Choose a new password</h2>

      <FieldGroup label="New password" htmlFor="password">
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </FieldGroup>

      {error && <p className="text-xs text-danger">{error}</p>}

      <Button type="submit" variant="primary" fullWidth center disabled={pending}>
        {pending ? "Saving…" : "Save password"}
      </Button>
    </form>
  );
}
