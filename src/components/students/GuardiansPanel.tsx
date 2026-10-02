"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2, Phone, Mail } from "lucide-react";
import { saveGuardian, deleteGuardian, type GuardianFields } from "@/lib/actions/guardians";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, inputClass, textareaClass } from "@/components/ui/FieldGroup";
import { Tag } from "@/components/ui/Tag";
import { useTerms } from "@/components/school/SchoolProvider";
import type { Guardian } from "@/lib/types";

const EMPTY: GuardianFields = {
  full_name: "",
  relationship: "",
  phone: "",
  email: "",
  is_primary: false,
  notes: "",
};

export function GuardiansPanel({
  studentId,
  guardians,
}: {
  studentId: string;
  guardians: Guardian[];
}) {
  const t = useTerms();
  const [editing, setEditing] = useState<{ id: string | null; values: GuardianFields } | null>(null);
  const [removing, setRemoving] = useState<Guardian | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setError(null);
    setEditing({ id: null, values: { ...EMPTY, is_primary: guardians.length === 0 } });
  }

  function openEdit(g: Guardian) {
    setError(null);
    setEditing({
      id: g.id,
      values: {
        full_name: g.full_name,
        relationship: g.relationship ?? "",
        phone: g.phone ?? "",
        email: g.email ?? "",
        is_primary: g.is_primary,
        notes: g.notes ?? "",
      },
    });
  }

  function patch(partial: Partial<GuardianFields>) {
    setEditing((cur) => (cur ? { ...cur, values: { ...cur.values, ...partial } } : cur));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    startTransition(async () => {
      const result = await saveGuardian(studentId, editing.id, editing.values);
      if (result.ok) setEditing(null);
      else setError(result.message ?? "Could not save.");
    });
  }

  const noun = t.guardian.one.toLowerCase();

  return (
    <div className="flex flex-col">
      <div className="flex justify-end px-5 pt-4">
        <Button variant="primary" icon={<Plus />} onClick={openNew}>
          Add {noun}
        </Button>
      </div>

      {guardians.length === 0 ? (
        <EmptyState message={`No ${t.guardian.many.toLowerCase()} on record yet.`} />
      ) : (
        <ul className="flex flex-col">
          {guardians.map((g) => (
            <li
              key={g.id}
              className="flex items-start gap-3 border-t border-line-soft px-5 py-3.5 first:border-t-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{g.full_name}</span>
                  {g.relationship && <span className="text-[12px] text-ink-soft">{g.relationship}</span>}
                  {g.is_primary && <Tag variant="ok">Primary</Tag>}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-mid">
                  {g.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {g.phone}
                    </span>
                  )}
                  {g.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> {g.email}
                    </span>
                  )}
                </div>
                {g.notes && <p className="mt-1 text-[12px] text-ink-soft">{g.notes}</p>}
              </div>
              <button
                type="button"
                onClick={() => openEdit(g)}
                className="text-ink-soft hover:text-ink"
                aria-label={`Edit ${g.full_name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setRemoving(g)}
                className="text-ink-soft hover:text-danger"
                aria-label={`Remove ${g.full_name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit ${noun}` : `Add ${noun}`}
        size="lg"
      >
        {editing && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <FieldGroup label="Name" htmlFor="g_name">
              <input
                id="g_name"
                required
                value={editing.values.full_name}
                onChange={(e) => patch({ full_name: e.target.value })}
                className={inputClass}
              />
            </FieldGroup>
            <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
              <FieldGroup label="Relationship" htmlFor="g_rel">
                <input
                  id="g_rel"
                  value={editing.values.relationship}
                  onChange={(e) => patch({ relationship: e.target.value })}
                  placeholder="e.g. Father"
                  className={inputClass}
                />
              </FieldGroup>
              <FieldGroup label="Phone" htmlFor="g_phone">
                <input
                  id="g_phone"
                  value={editing.values.phone}
                  onChange={(e) => patch({ phone: e.target.value })}
                  className={inputClass}
                />
              </FieldGroup>
            </div>
            <FieldGroup label="Email" htmlFor="g_email">
              <input
                id="g_email"
                type="email"
                value={editing.values.email}
                onChange={(e) => patch({ email: e.target.value })}
                className={inputClass}
              />
            </FieldGroup>
            <FieldGroup label="Notes" htmlFor="g_notes">
              <textarea
                id="g_notes"
                rows={2}
                value={editing.values.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                className={textareaClass}
              />
            </FieldGroup>
            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={editing.values.is_primary}
                onChange={(e) => patch({ is_primary: e.target.checked })}
              />
              Primary contact
            </label>
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={`Remove this ${noun}?`}
        description={`${removing?.full_name ?? "They"} will be removed from the student record.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => deleteGuardian(studentId, removing!.id)}
      />
    </div>
  );
}
