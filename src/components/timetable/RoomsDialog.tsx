"use client";

import { useState, useTransition } from "react";
import { Archive, Plus, Save } from "lucide-react";
import { archiveRoom, saveRoom } from "@/lib/actions/timetable";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { inputClass } from "@/components/ui/FieldGroup";
import type { Room } from "@/lib/types";

type Draft = { id: string | null; name: string; capacity: string };

export function RoomsDialog({ open, onClose, rooms }: { open: boolean; onClose: () => void; rooms: Room[] }) {
  const [draft, setDraft] = useState<Draft>({ id: null, name: "", capacity: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setDraft({ id: null, name: "", capacity: "" });
    setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveRoom(draft.id, { name: draft.name, capacity: draft.capacity });
      if (result.ok) reset();
      else setError(result.message ?? "Could not save.");
    });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await archiveRoom(id);
      if (!result.ok) setError(result.message ?? "Could not archive.");
      else if (draft.id === id) reset();
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title="Rooms" size="lg">
      <div className="flex flex-col gap-4">
        {rooms.length === 0 ? (
          <p className="text-[13px] text-ink-soft">No rooms yet. Add one below.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line-soft rounded-md border border-line-soft">
            {rooms.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <span className="text-[13.5px] font-semibold">{r.name}</span>
                  {r.capacity && <span className="ml-2 text-[12px] text-ink-soft">seats {r.capacity}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => setDraft({ id: r.id, name: r.name, capacity: r.capacity ? String(r.capacity) : "" })}
                  className="text-[12px] font-semibold text-brand-deep hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  disabled={pending}
                  className="text-ink-soft hover:text-danger"
                  aria-label={`Archive ${r.name}`}
                >
                  <Archive className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[160px] flex-1 flex-col gap-1.5 text-[12.5px] font-semibold text-ink-mid">
            {draft.id ? "Edit room" : "New room"}
            <input
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Kitchen A"
              className={inputClass}
            />
          </label>
          <label className="flex w-28 flex-col gap-1.5 text-[12.5px] font-semibold text-ink-mid">
            Seats
            <input
              inputMode="numeric"
              value={draft.capacity}
              onChange={(e) => setDraft({ ...draft, capacity: e.target.value })}
              placeholder="Optional"
              className={inputClass}
            />
          </label>
          <Button type="submit" variant="primary" icon={draft.id ? <Save /> : <Plus />} disabled={pending}>
            {draft.id ? "Save" : "Add"}
          </Button>
          {draft.id && (
            <Button type="button" onClick={reset} disabled={pending}>
              Cancel
            </Button>
          )}
        </form>

        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </Dialog>
  );
}
