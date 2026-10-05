"use client";

import { useState } from "react";
import { KeyRound, UserX } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { grantTeacherAccess, revokeTeacherAccess } from "@/lib/actions/teachers";
import { useRole, useTerms } from "@/components/school/SchoolProvider";

/**
 * Owners and admins only. Gives (or removes) the portal login for a
 * lecturer/teacher record; the login is matched by the record's email.
 */
export function PortalAccessButton({
  id,
  name,
  email,
  hasAccess,
}: {
  id: string;
  name: string;
  email: string | null;
  hasAccess: boolean;
}) {
  const role = useRole();
  const t = useTerms();
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (role !== "owner" && role !== "admin") return null;

  async function grant() {
    setPending(true);
    setError(null);
    const result = await grantTeacherAccess(id);
    setPending(false);
    if (result.ok) setGrantOpen(false);
    else setError(result.message ?? "Could not give access.");
  }

  if (hasAccess) {
    return (
      <>
        <button
          type="button"
          onClick={() => setRevokeOpen(true)}
          className="text-ink-soft hover:text-danger"
          aria-label={`Remove portal access for ${name}`}
          title="Remove portal access"
        >
          <UserX className="h-4 w-4" />
        </button>
        <ConfirmDialog
          open={revokeOpen}
          onClose={() => setRevokeOpen(false)}
          title="Remove portal access?"
          description={`${name} will no longer be able to sign in. Their record and classes stay.`}
          confirmLabel="Remove access"
          variant="danger"
          onConfirm={() => revokeTeacherAccess(id)}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setGrantOpen(true);
        }}
        className="text-ink-soft hover:text-ink"
        aria-label={`Give portal access to ${name}`}
        title="Give portal access"
      >
        <KeyRound className="h-4 w-4" />
      </button>
      <Dialog open={grantOpen} onClose={() => setGrantOpen(false)} title={`Give ${name} a login`}>
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-ink-mid">
            {email
              ? `${name} will sign in with ${email} and see only their own ${t.intake.many.toLowerCase()} and ${t.subject.many.toLowerCase()}. If there is no account for that email yet, an invite is sent.`
              : `Add an email address to this ${t.instructor.one.toLowerCase()} first. The login is matched by email.`}
          </p>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setGrantOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={grant} disabled={pending || !email}>
              {pending ? "Working…" : "Give access"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
