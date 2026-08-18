"use client";

import { useActionState } from "react";
import { User } from "lucide-react";
import { FieldGroup } from "@/components/ui/FieldGroup";
import { IconField } from "@/components/ui/IconField";
import { Button } from "@/components/ui/Button";
import { updateProfile } from "@/lib/actions/auth";

export function ProfileForm({ defaultFullName }: { defaultFullName: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, { status: "idle" });

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <FieldGroup label="Full name" htmlFor="fullName">
        <IconField
          icon={<User />}
          id="fullName"
          name="fullName"
          defaultValue={defaultFullName}
          required
        />
      </FieldGroup>

      {state.status === "error" && <p className="text-xs text-danger">{state.message}</p>}
      {state.status === "saved" && <p className="text-xs text-sage-ink">Saved.</p>}

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Saving…" : "Save name"}
      </Button>
    </form>
  );
}
