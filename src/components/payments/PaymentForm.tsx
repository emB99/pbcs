"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Banknote, Coins, TrendingUp, Hash, MessageSquare, Receipt } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { MoneyCell } from "@/components/ui/MoneyCell";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { IconField } from "@/components/ui/IconField";
import { IconSelect } from "@/components/ui/IconSelect";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useFormat } from "@/components/school/SchoolProvider";
import { parseMoneyInput } from "@/lib/money";
import { methodLabel, referenceLabel } from "@/lib/format";
import { recordPayment } from "@/lib/actions/transactions";

export type StudentOption = {
  id: string;
  full_name: string;
  phone: string | null;
  student_number: string;
  balance: number;
};

export type EnrolmentOption = {
  id: string;
  student_id: string;
  course_name: string;
  intake_label: string;
  balance: number;
};

export function PaymentForm({
  students,
  enrolments,
  currencies,
  methods,
  lastRates,
  initialStudentId,
}: {
  students: StudentOption[];
  enrolments: EnrolmentOption[];
  /** The school's base currency first, then any other currencies it accepts. */
  currencies: string[];
  /** The payment methods the school offers. */
  methods: string[];
  /** The most recent exchange rate used per non-base currency. */
  lastRates: Record<string, number>;
  initialStudentId?: string;
}) {
  const fmt = useFormat();
  const baseCurrency = currencies[0];
  const initialStudent = students.find((s) => s.id === initialStudentId) ?? null;
  const [query, setQuery] = useState("");
  const [student, setStudent] = useState<StudentOption | null>(initialStudent);
  // Arriving from a student's page with exactly one active enrolment: pick it for them.
  const initialEnrolments = initialStudent ? enrolments.filter((e) => e.student_id === initialStudent.id) : [];
  const [enrolmentId, setEnrolmentId] = useState<string | null>(
    initialEnrolments.length === 1 ? initialEnrolments[0].id : null,
  );

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(baseCurrency);
  const [rate, setRate] = useState("1");
  const [date, setDate] = useState(fmt.today());
  const [method, setMethod] = useState(methods[0] ?? "cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ balance: number; transactionId: string } | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!normalizedQuery) return [];
    return students
      .filter(
        (s) =>
          s.full_name.toLowerCase().includes(normalizedQuery) ||
          (s.phone ?? "").replace(/\s+/g, "").includes(normalizedQuery.replace(/\s+/g, "")) ||
          s.student_number.toLowerCase().includes(normalizedQuery),
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
    setCurrency(baseCurrency);
    setRate("1");
    setDate(fmt.today());
    setMethod(methods[0] ?? "cash");
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
        rate_to_base: rate,
        occurred_on: date,
        method,
        reference,
        note,
      });
      if (res.ok) {
        setResult({ balance: res.balance, transactionId: res.transactionId });
      } else {
        setErrors(res.errors ?? {});
        setMessage(res.message ?? null);
      }
    });
  }

  if (result && student) {
    return (
      <Card className="flex max-w-lg flex-col items-center gap-4 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-success-ink" />
        <div>
          <h2 className="font-display text-lg font-semibold">Payment recorded</h2>
          <p className="mt-1 text-[13px] text-ink-mid">{student.full_name}&apos;s new balance:</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
            {fmt.money(result.balance)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/print/receipt/${result.transactionId}`}>
            <Button icon={<Receipt />}>View receipt</Button>
          </Link>
          <Button variant="primary" onClick={reset}>
            Record another payment
          </Button>
          <Link href={`/students/${student.id}`}>
            <Button>View student</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg">
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
      {!student ? (
        <FieldGroup label="Find a student">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by name, number or phone" />
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
                      <span className="block text-[11.5px] text-ink-soft">{s.student_number}{s.phone ? ` · ${s.phone}` : ""}</span>
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
              <span className="block text-[11.5px] text-ink-soft">{student.student_number}{student.phone ? ` · ${student.phone}` : ""}</span>
            </span>
          </span>
          <button
            type="button"
            onClick={reset}
            className="text-[12px] font-semibold text-brand-deep hover:underline"
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
                  enrolmentId === e.id ? "bg-brand-tint" : "hover:bg-surface-2"
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
              <IconField
                icon={<Banknote />}
                id="amount"
                inputMode="decimal"
                placeholder="50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </FieldGroup>
            <FieldGroup label="Currency" htmlFor="currency" error={errors.currency?.[0]}>
              <IconSelect
                icon={<Coins />}
                id="currency"
                value={currency}
                onChange={(e) => {
                  const next = e.target.value;
                  setCurrency(next);
                  if (next === baseCurrency) setRate("1");
                  else setRate(lastRates[next] !== undefined ? String(lastRates[next]) : "");
                }}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </IconSelect>
            </FieldGroup>
          </div>

          {currency !== baseCurrency && (
            <FieldGroup
              label={`Exchange rate (1 ${baseCurrency} = ? ${currency})`}
              htmlFor="rate"
              error={errors.rate_to_base?.[0]}
            >
              <IconField
                icon={<TrendingUp />}
                id="rate"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                required
              />
              {Number(rate) > 0 && parseMoneyInput(amount) !== null && (
                <p className="text-xs text-ink-soft">
                  About {fmt.money(Number(parseMoneyInput(amount)) / Number(rate), baseCurrency)} towards the balance.
                </p>
              )}
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

          <FieldGroup label="Method" error={errors.method?.[0]}>
            <SegmentedControl
              name="method"
              value={method}
              onChange={setMethod}
              options={methods.map((m) => ({ label: methodLabel(m), value: m }))}
            />
          </FieldGroup>

          <FieldGroup label={referenceLabel(method)} htmlFor="reference" error={errors.reference?.[0]}>
            <IconField
              icon={<Hash />}
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </FieldGroup>

          <FieldGroup label="Note" htmlFor="note" error={errors.note?.[0]}>
            <IconField
              icon={<MessageSquare />}
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
            />
          </FieldGroup>

          {message && <p className="text-xs text-danger">{message}</p>}

          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Recording…" : "Record payment"}
          </Button>
        </>
      )}
      </form>
    </Card>
  );
}
