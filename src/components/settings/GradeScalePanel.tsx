"use client";

import { useState, useTransition } from "react";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { saveGradeScale, resetGradeScale } from "@/lib/actions/grades";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { GradeBand } from "@/lib/types";

type Row = { key: string; min_mark: string; grade: string; description: string; is_pass: boolean };

const cell =
  "w-full rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] outline-none focus-visible:border-crust";

function toRows(bands: GradeBand[]): Row[] {
  return [...bands]
    .sort((a, b) => b.min_mark - a.min_mark)
    .map((b) => ({
      key: b.id,
      min_mark: String(b.min_mark),
      grade: b.grade,
      description: b.description ?? "",
      is_pass: b.is_pass,
    }));
}

export function GradeScalePanel({ bands }: { bands: GradeBand[] }) {
  const [rows, setRows] = useState<Row[]>(() => toRows(bands));
  const [dirty, setDirty] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function patch(key: string, partial: Partial<Row>) {
    setRows((cur) => cur.map((r) => (r.key === key ? { ...r, ...partial } : r)));
    setDirty(true);
    setMessage(null);
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveGradeScale(
        rows.map(({ min_mark, grade, description, is_pass }) => ({ min_mark, grade, description, is_pass })),
      );
      if (result.ok) {
        setDirty(false);
        setMessage({ ok: true, text: "Saved." });
      } else {
        setMessage({ ok: false, text: result.message ?? "Could not save." });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 px-6 pb-6">
      <p className="text-[12.5px] text-ink-soft">
        A mark gets the grade of the highest band it reaches. One band must start at 0. Changing the scale does
        not rewrite grades already saved; they update the next time marks are saved.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead>
            <tr className="text-[11px] font-semibold tracking-[0.05em] text-ink-soft uppercase">
              <th className="py-2 pr-2">From mark</th>
              <th className="px-2 py-2">Grade</th>
              <th className="px-2 py-2">Description</th>
              <th className="px-2 py-2">Pass?</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-line-soft">
                <td className="py-2 pr-2">
                  <input
                    aria-label="Starting mark"
                    inputMode="decimal"
                    value={r.min_mark}
                    onChange={(e) => patch(r.key, { min_mark: e.target.value })}
                    className={`${cell} w-24 tabular-nums`}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    aria-label="Grade"
                    value={r.grade}
                    maxLength={20}
                    onChange={(e) => patch(r.key, { grade: e.target.value })}
                    className={`${cell} w-32`}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    aria-label="Description"
                    value={r.description}
                    maxLength={60}
                    onChange={(e) => patch(r.key, { description: e.target.value })}
                    className={cell}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    aria-label="Counts as a pass"
                    checked={r.is_pass}
                    onChange={(e) => patch(r.key, { is_pass: e.target.checked })}
                  />
                </td>
                <td className="py-2 pl-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setRows((cur) => cur.filter((x) => x.key !== r.key));
                      setDirty(true);
                    }}
                    className="text-ink-soft hover:text-danger"
                    aria-label="Remove band"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message && <p className={`text-xs ${message.ok ? "text-sage-ink" : "text-danger"}`}>{message.text}</p>}

      <div className="flex flex-wrap gap-2">
        <Button
          icon={<Plus />}
          onClick={() => {
            setRows((cur) => [
              ...cur,
              { key: crypto.randomUUID(), min_mark: "", grade: "", description: "", is_pass: true },
            ]);
            setDirty(true);
          }}
        >
          Add band
        </Button>
        <Button variant="primary" icon={<Save />} onClick={save} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save scale"}
        </Button>
        <div className="min-w-3 flex-1" />
        <Button icon={<RotateCcw />} onClick={() => setResetOpen(true)} disabled={pending}>
          Reset to defaults
        </Button>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset the grade scale?"
        description="This replaces your scale with the default for your type of school."
        confirmLabel="Reset"
        variant="danger"
        onConfirm={async () => {
          const result = await resetGradeScale();
          if (result.ok) {
            // The page reloads its data; clear local edits so the refreshed scale shows.
            window.location.reload();
          }
          return result;
        }}
      />
    </div>
  );
}
