"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { FieldGroup } from "@/components/ui/FieldGroup";
import { IconField } from "@/components/ui/IconField";
import { Button } from "@/components/ui/Button";
import { changePassword } from "@/lib/actions/auth";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await changePassword({ password, confirmPassword });
      if (result.ok) {
        setSaved(true);
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(result.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <FieldGroup label="New password" htmlFor="new-password">
        <IconField
          icon={<Lock />}
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </FieldGroup>

      <FieldGroup label="Confirm password" htmlFor="confirm-password">
        <IconField
          icon={<Lock />}
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </FieldGroup>

      {error && <p className="text-xs text-danger">{error}</p>}
      {saved && <p className="text-xs text-sage-ink">Password updated.</p>}

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
