"use client";

import { useState, useTransition } from "react";
import { CalendarClock, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { clearPlan, createPlan, deleteInstalment, saveInstalment } from "@/lib/actions/instalments";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { Tag } from "@/components/ui/Tag";
import { useFormat } from "@/components/school/SchoolProvider";
import { cn } from "@/lib/cn";

export type InstalmentRow = {
  id: string;
  due_on: string;
  amount: number;
  covered: number;
  is_paid: boolean;
  is_overdue: boolean;
  days_overdue: number;
  note: string | null;
};

type RowDraft = { id: string | null; due_on: string; amount: string; note: string };

const FREQUENCY_LABEL = { weekly: "Every week", fortnightly: "Every two weeks", monthly: "Every month" } as const;

/**
 * An enrolment's payment plan: when each instalment is due and whether the
 * payments so far have covered it. What is covered comes from the database
 * (payments fill the earliest instalments first); this only displays it.
 */
export function InstalmentsPanel({
  enrolmentId,
  rows,
  balance,
  editable,
}: {
  enrolmentId: string;
  rows: InstalmentRow[];
  /** What the student still owes on this enrolment, used to suggest a plan total. */
  balance: number;
  /** Plans can only be changed while the enrolment is active. */
  editable: boolean;
}) {
  const fmt = useFormat();
  const [open, setOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [draft, setDraft] = useState<RowDraft | null>(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [count, setCount] = useState("3");
  const [frequency, setFrequency] = useState<keyof typeof FREQUENCY_LABEL>("monthly");
  const [firstDue, setFirstDue] = useState("");
  const [total, setTotal] = useState("");

  const overdue = rows.filter((r) => r.is_overdue);
  const next = rows.find((r) => !r.is_paid);

  if (rows.length === 0 && (!editable || balance <= 0)) return null;

  function openPlan() {
    setError(null);
    setCount("3");
    setFrequency("monthly");
    setFirstDue(fmt.today());
    setTotal(balance > 0 ? balance.toFixed(2) : "");
    setPlanOpen(true);
  }

  function submitPlan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createPlan(enrolmentId, {
        count: Number(count),
        frequency,
        first_due: firstDue,
        total,
      });
      if (result.ok) {
        setPlanOpen(false);
        setOpen(true);
      } else {
        setError(result.message ?? "Could not create the plan.");
      }
    });
  }

  function submitRow(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const result = await saveInstalment(enrolmentId, draft.id, {
        due_on: draft.due_on,
        amount: draft.amount,
        note: draft.note,
      });
      if (result.ok) setDraft(null);
      else setError(result.message ?? "Could not save.");
    });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteInstalment(enrolmentId, id);
      if (!result.ok) setError(result.message ?? "Could not remove it.");
    });
  }

  if (rows.length === 0) {
    return (
      <div className="border-t border-line-soft px-5 py-2.5">
        <button
          type="button"
          onClick={openPlan}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-deep hover:underline"
        >
          <CalendarClock className="h-3.5 w-3.5" /> Set up a payment plan
        </button>
        {planDialog()}
      </div>
    );
  }

  function planDialog() {
    return (
      <Dialog open={planOpen} onClose={() => setPlanOpen(false)} title="Set up a payment plan" size="lg">
        <form onSubmit={submitPlan} className="flex flex-col gap-4">
          <FieldGroup label={`Total to spread (${fmt.currency})`} htmlFor="plan_total">
            <input
              id="plan_total"
              inputMode="decimal"
              required
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className={inputClass}
            />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
            <FieldGroup label="Number of instalments" htmlFor="plan_count">
              <input
                id="plan_count"
                type="number"
                min={1}
                max={36}
                required
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className={inputClass}
              />
            </FieldGroup>
            <FieldGroup label="How often" htmlFor="plan_frequency">
              <select
                id="plan_frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as keyof typeof FREQUENCY_LABEL)}
                className={inputClass}
              >
                {Object.entries(FREQUENCY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FieldGroup>
          </div>
          <FieldGroup label="First instalment due" htmlFor="plan_first">
            <input
              id="plan_first"
              type="date"
              required
              value={firstDue}
              onChange={(e) => setFirstDue(e.target.value)}
              className={inputClass}
            />
          </FieldGroup>
          <p className="text-xs text-ink-soft">
            The total is split into equal parts (the last one takes any odd cents). You can adjust each instalment
            afterwards.
          </p>
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Creating…" : "Create plan"}
          </Button>
        </form>
      </Dialog>
    );
  }

  return (
    <div className="border-t border-line-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-5 py-2.5 text-left text-[12.5px] hover:bg-surface-2"
      >
        <CalendarClock className="h-3.5 w-3.5 flex-none text-ink-soft" />
        <span className="font-semibold">Payment plan</span>
        <span className="text-ink-soft">
          {rows.length} instalments
          {next && ` · next ${fmt.date(next.due_on)}`}
          {!next && " · all covered"}
        </span>
        {overdue.length > 0 && <Tag variant="late">{overdue.length} overdue</Tag>}
        <ChevronDown className={cn("ml-auto h-4 w-4 flex-none text-ink-soft transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-5 pb-4">
          <ul className="flex flex-col divide-y divide-line-soft rounded-md border border-line-soft">
            {rows.map((r, i) => {
              const partial = !r.is_paid && r.covered > 0;
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-[13px]">
                  <span className="w-5 text-[11px] text-ink-soft tabular-nums">{i + 1}</span>
                  <span className="w-[104px] font-medium">{fmt.date(r.due_on)}</span>
                  <span className="money w-24 font-semibold">{fmt.money(r.amount)}</span>
                  <span className="min-w-0 flex-1">
                    {r.is_paid ? (
                      <Tag variant="ok">Paid</Tag>
                    ) : r.is_overdue ? (
                      <Tag variant="late">Overdue {r.days_overdue} {r.days_overdue === 1 ? "day" : "days"}</Tag>
                    ) : partial ? (
                      <Tag variant="due">Part-paid</Tag>
                    ) : (
                      <span className="text-[12px] text-ink-soft">Upcoming</span>
                    )}
                    {partial && (
                      <span className="ml-2 text-[12px] text-ink-soft">
                        {fmt.money(r.amount - r.covered)} to go
                      </span>
                    )}
                    {r.note && <span className="ml-2 text-[12px] text-ink-soft">{r.note}</span>}
                  </span>
                  {editable && (
                    <span className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setDraft({ id: r.id, due_on: r.due_on, amount: r.amount.toFixed(2), note: r.note ?? "" });
                        }}
                        className="text-ink-soft hover:text-ink"
                        aria-label={`Edit instalment ${i + 1}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(r.id)}
                        disabled={pending}
                        className="text-ink-soft hover:text-danger"
                        aria-label={`Remove instalment ${i + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {error && !draft && <p className="mt-2 text-xs text-danger">{error}</p>}

          {editable && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                icon={<Plus />}
                onClick={() => {
                  setError(null);
                  setDraft({ id: null, due_on: fmt.today(), amount: "", note: "" });
                }}
              >
                Add instalment
              </Button>
              <Button variant="danger" onClick={() => setClearing(true)}>
                Remove plan
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={draft !== null} onClose={() => setDraft(null)} title={draft?.id ? "Edit instalment" : "Add an instalment"}>
        {draft && (
          <form onSubmit={submitRow} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
              <FieldGroup label="Due on" htmlFor="inst_due">
                <input
                  id="inst_due"
                  type="date"
                  required
                  value={draft.due_on}
                  onChange={(e) => setDraft({ ...draft, due_on: e.target.value })}
                  className={inputClass}
                />
              </FieldGroup>
              <FieldGroup label={`Amount (${fmt.currency})`} htmlFor="inst_amount">
                <input
                  id="inst_amount"
                  inputMode="decimal"
                  required
                  value={draft.amount}
                  onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                  className={inputClass}
                />
              </FieldGroup>
            </div>
            <FieldGroup label="Note" htmlFor="inst_note">
              <input
                id="inst_note"
                value={draft.note}
                placeholder="Optional, e.g. Deposit"
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                className={inputClass}
              />
            </FieldGroup>
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={clearing}
        onClose={() => setClearing(false)}
        title="Remove the payment plan?"
        description="The schedule is deleted. Payments already recorded are not affected."
        confirmLabel="Remove plan"
        variant="danger"
        onConfirm={() => clearPlan(enrolmentId)}
      />
    </div>
  );
}
