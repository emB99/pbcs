"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { MoneyCell } from "@/components/ui/MoneyCell";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { PrintButton } from "@/components/ui/PrintButton";
import { todayIsoDate } from "@/lib/dates";
import { recordPayment } from "@/lib/actions/transactions";
import type { PaymentMethod } from "@/lib/types";

export type StudentOption = {
  id: string;
  full_name: string;
  phone: string;
  balance: string;
};

export type EnrolmentOption = {
  id: string;
  student_id: string;
  course_name: string;
  intake_label: string;
  balance: string;
};

const METHOD_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: "Cash", value: "cash" },
  { label: "EcoCash", value: "ecocash" },
  { label: "Bank transfer", value: "bank_transfer" },
  { label: "Other", value: "other" },
];

const REFERENCE_LABEL: Record<PaymentMethod, string> = {
  cash: "Receipt number",
  ecocash: "EcoCash reference",
  bank_transfer: "Bank reference",
  other: "Reference",
};

export function PaymentForm({
  students,
  enrolments,
  lastZwgRate,
  initialStudentId,
}: {
  students: StudentOption[];
  enrolments: EnrolmentOption[];
  lastZwgRate: string | null;
  initialStudentId?: string;
}) {
  const initialStudent = students.find((s) => s.id === initialStudentId) ?? null;
  const [query, setQuery] = useState("");
  const [student, setStudent] = useState<StudentOption | null>(initialStudent);
  const [enrolmentId, setEnrolmentId] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"USD" | "ZWG">("USD");
  const [rate, setRate] = useState(lastZwgRate ?? "1");
  const [date, setDate] = useState(todayIsoDate());
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ balance: string } | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!normalizedQuery) return [];
    return students
      .filter(
        (s) =>
          s.full_name.toLowerCase().includes(normalizedQuery) ||
          s.phone.replace(/\s+/g, "").includes(normalizedQuery.replace(/\s+/g, "")),
      )
      .slice(0, 8);
  }, [students, normalizedQuery]);

  const studentEnrolments = useMemo(
    () => (student ? enrolments.filter((e) => e.student_id === student.id) : []),
    [enrolments, student],
  );

  function selectStudent(s: StudentOption) {
    setStudent(s);
    setQuery("");
    const theirs = enrolments.filter((e) => e.student_id === s.id);
    setEnrolmentId(theirs.length === 1 ? theirs[0].id : null);
    setResult(null);
  }

  function reset() {
    setStudent(null);
    setEnrolmentId(null);
    setAmount("");
    setCurrency("USD");
    setRate(lastZwgRate ?? "1");
    setDate(todayIsoDate());
    setMethod("cash");
    setReference("");
    setNote("");
    setErrors({});
    setMessage(null);
    setResult(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enrolmentId) return;
    setErrors({});
    setMessage(null);
    startTransition(async () => {
      const res = await recordPayment({
        enrolment_id: enrolmentId,
        amount,
        currency,
        rate_to_usd: rate,
        occurred_on: date,
        method,
        reference,
        note,
      });
      if (res.ok) {
        setResult({ balance: res.balance });
      } else {
        setErrors(res.errors ?? {});
        setMessage(res.message ?? null);
      }
    });
  }

  if (result && student) {
    return (
      <div className="flex max-w-lg flex-col items-center gap-4 rounded-lg border border-line bg-surface p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-sage-ink" />
        <div>
          <h2 className="font-display text-lg font-semibold">Payment recorded</h2>
          <p className="mt-1 text-[13px] text-ink-mid">{student.full_name}&apos;s new balance:</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
            ${Number(result.balance).toFixed(2)}
          </p>
        </div>
        <div className="flex gap-2">
          <PrintButton label="Print receipt" />
          <Button variant="primary" onClick={reset}>
            Record another payment
          </Button>
          <Link href={`/students/${student.id}`}>
            <Button>View student</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      {!student ? (
        <FieldGroup label="Find a student">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by name or phone" />
          {matches.length > 0 && (
            <div className="mt-2 flex flex-col overflow-hidden rounded-md border border-line">
              {matches.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectStudent(s)}
                  className="flex items-center justify-between gap-3 border-b border-line-soft px-3.5 py-2.5 text-left last:border-b-0 hover:bg-surface-2"
                >
                  <span className="flex items-center gap-2.5">
                    <AvatarInitials id={s.id} name={s.full_name} size="sm" />
                    <span>
                      <span className="block text-[13px] font-semibold">{s.full_name}</span>
                      <span className="block text-[11.5px] text-ink-soft">{s.phone}</span>
                    </span>
                  </span>
                  <MoneyCell amount={s.balance} variant={Number(s.balance) > 0 ? "owing" : "muted"} />
                </button>
              ))}
            </div>
          )}
        </FieldGroup>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-2 p-3">
          <span className="flex items-center gap-2.5">
            <AvatarInitials id={student.id} name={student.full_name} size="sm" />
            <span>
              <span className="block text-[13px] font-semibold">{student.full_name}</span>
              <span className="block text-[11.5px] text-ink-soft">{student.phone}</span>
            </span>
          </span>
          <button
            type="button"
            onClick={reset}
            className="text-[12px] font-semibold text-crust-deep hover:underline"
          >
            Change
          </button>
        </div>
      )}

      {student && studentEnrolments.length === 0 && (
        <p className="text-[13px] text-ink-soft">This student has no active enrolments.</p>
      )}

      {student && studentEnrolments.length > 1 && (
        <FieldGroup label="Which enrolment?" error={errors.enrolment_id?.[0]}>
          <div className="flex flex-col overflow-hidden rounded-md border border-line">
            {studentEnrolments.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEnrolmentId(e.id)}
                className={`flex items-center justify-between gap-3 border-b border-line-soft px-3.5 py-2.5 text-left last:border-b-0 ${
                  enrolmentId === e.id ? "bg-crust-tint" : "hover:bg-surface-2"
                }`}
              >
                <span>
                  <span className="block text-[13px] font-semibold">{e.course_name}</span>
                  <span className="block text-[11.5px] text-ink-soft">{e.intake_label}</span>
                </span>
                <MoneyCell amount={e.balance} variant={Number(e.balance) > 0 ? "owing" : "muted"} />
              </button>
            ))}
          </div>
        </FieldGroup>
      )}

      {enrolmentId && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Amount" htmlFor="amount" error={errors.amount?.[0]}>
              <input
                id="amount"
                inputMode="decimal"
                placeholder="50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className={inputClass}
              />
            </FieldGroup>
            <FieldGroup label="Currency" htmlFor="currency">
              <select
                id="currency"
                value={currency}
                onChange={(e) => {
                  const next = e.target.value as "USD" | "ZWG";
                  setCurrency(next);
                  if (next === "USD") setRate("1");
                  else setRate(lastZwgRate ?? "");
                }}
                className={inputClass}
              >
                <option value="USD">USD</option>
                <option value="ZWG">ZWG</option>
              </select>
            </FieldGroup>
          </div>

          {currency === "ZWG" && (
            <FieldGroup label="Rate to USD" htmlFor="rate" error={errors.rate_to_usd?.[0]}>
              <input
                id="rate"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                required
                className={inputClass}
              />
            </FieldGroup>
          )}

          <FieldGroup label="Date" htmlFor="date" error={errors.occurred_on?.[0]}>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={inputClass}
            />
          </FieldGroup>

          <FieldGroup label="Method">
            <SegmentedControl
              name="method"
              value={method}
              onChange={setMethod}
              options={METHOD_OPTIONS}
            />
          </FieldGroup>

          <FieldGroup label={REFERENCE_LABEL[method]} htmlFor="reference" error={errors.reference?.[0]}>
            <input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputClass}
            />
          </FieldGroup>

          <FieldGroup label="Note" htmlFor="note" error={errors.note?.[0]}>
            <input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </FieldGroup>

          {message && <p className="text-xs text-danger">{message}</p>}

          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Recording…" : "Record payment"}
          </Button>
        </>
      )}
    </form>
  );
}
