"use client";

import { useState, useTransition } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { inviteMember, changeMemberRole, removeMember } from "@/lib/actions/team";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { Tag } from "@/components/ui/Tag";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import type { AppRole } from "@/lib/types";

export type TeamMember = {
  user_id: string;
  role: AppRole;
  name: string;
  email: string | null;
};

const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Office staff",
  teacher: "Teacher",
};

const ROLE_HELP: Record<AppRole, string> = {
  owner: "Full control, including other admins",
  admin: "Everything except changing owners",
  staff: "Day-to-day office work: students, enrolments, payments",
  teacher: "Sees only their own classes (marks and attendance)",
};

export function TeamPanel({
  members,
  currentUserId,
  currentRole,
}: {
  members: TeamMember[];
  currentUserId: string;
  currentRole: AppRole;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("staff");
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const assignable: AppRole[] =
    currentRole === "owner" ? ["owner", "admin", "staff", "teacher"] : ["admin", "staff", "teacher"];

  function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await inviteMember({ email, role });
      if (!result.ok) {
        setError(result.message ?? "Could not send the invite.");
        return;
      }
      setInviteOpen(false);
      setEmail("");
    });
  }

  function changeRole(userId: string, next: string) {
    setRowError(null);
    startTransition(async () => {
      const result = await changeMemberRole(userId, next);
      if (!result.ok) setRowError(result.message ?? "Could not change the role.");
    });
  }

  return (
    <div className="flex flex-col gap-4 px-6 pb-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-ink-soft">
          People who can sign in to this school. Invited people get an email to set a password.
        </p>
        <Button variant="primary" icon={<UserPlus />} onClick={() => setInviteOpen(true)}>
          Invite
        </Button>
      </div>

      {rowError && <p className="text-xs text-danger">{rowError}</p>}

      <ul className="flex flex-col divide-y divide-line-soft rounded-md border border-line-soft">
        {members.map((m) => {
          const isSelf = m.user_id === currentUserId;
          const locked = isSelf || (m.role === "owner" && currentRole !== "owner");
          return (
            <li key={m.user_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <AvatarInitials id={m.user_id} name={m.name} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold">
                  {m.name} {isSelf && <Tag variant="ok">You</Tag>}
                </div>
                <div className="truncate text-xs text-ink-soft">{m.email}</div>
              </div>
              {locked ? (
                <span className="text-[12.5px] text-ink-mid">{ROLE_LABELS[m.role]}</span>
              ) : (
                <select
                  aria-label={`Role for ${m.name}`}
                  value={m.role}
                  disabled={pending}
                  onChange={(e) => changeRole(m.user_id, e.target.value)}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px]"
                >
                  {assignable.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              )}
              {!locked && (
                <button
                  type="button"
                  onClick={() => setRemoving(m)}
                  className="text-ink-soft hover:text-danger"
                  aria-label={`Remove ${m.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite someone" size="lg">
        <form onSubmit={submitInvite} className="flex flex-col gap-4">
          <FieldGroup label="Email" htmlFor="invite_email">
            <input
              id="invite_email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </FieldGroup>
          <FieldGroup label="Role" htmlFor="invite_role">
            <select
              id="invite_role"
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
              className={inputClass}
            >
              {assignable
                .filter((r) => r !== "owner")
                .map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
            </select>
            <p className="text-xs text-ink-soft">{ROLE_HELP[role]}</p>
          </FieldGroup>
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Sending…" : "Send invite"}
          </Button>
        </form>
      </Dialog>

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove from the school?"
        description={`${removing?.name ?? "They"} will no longer be able to use the app. Nothing they entered is deleted.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => removeMember(removing!.user_id)}
      />
    </div>
  );
}
