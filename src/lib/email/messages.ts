import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { makeFormat, methodLabel, todayInTimezone, type Format } from "@/lib/format";
import type { SchoolSettings } from "@/lib/types";
import { deliver, emailBrand, resolveRecipient, type Delivery } from "@/lib/email/send";
import {
  balanceReminderEmail,
  instalmentReminderEmail,
  receiptEmail,
  testEmail,
  type InstalmentItem,
} from "@/lib/email/templates";

type Db = SupabaseClient<Database>;

export function schoolFormat(settings: SchoolSettings): Format {
  return makeFormat({ currency: settings.base_currency, locale: settings.locale, timezone: settings.timezone });
}

type CourseJoin = { label: string | null; start_date: string | null; course: { name: string } | null } | null;

function enrolmentLabel(fmt: Format, intake: CourseJoin): string {
  const course = intake?.course?.name ?? "";
  const when = intake?.label || (intake?.start_date ? fmt.monthYear(intake.start_date) : "");
  return [course, when].filter(Boolean).join(" · ") || "Account";
}

export type SendResult = Delivery & { to: string | null };

export async function sendTest(supabase: Db, settings: SchoolSettings, to: string): Promise<SendResult> {
  const brand = emailBrand(settings);
  const result = await deliver(supabase, brand, { kind: "test", studentId: null, to }, testEmail(brand, to));
  return { ...result, to };
}

/** Emails the receipt for a payment to the student (or guardian). Returns null if the entry has no receipt. */
export async function sendReceipt(supabase: Db, settings: SchoolSettings, transactionId: string): Promise<SendResult | null> {
  const { data: txn } = await supabase.from("transactions").select("*").eq("id", transactionId).maybeSingle();
  if (!txn || txn.kind !== "payment" || !txn.document_number) return null;

  const [{ data: enrolment }, { data: balanceAfter }, { data: reversal }] = await Promise.all([
    supabase
      .from("enrolments")
      .select("id, student:students(id, full_name), intake:intakes(label, start_date, course:courses(name))")
      .eq("id", txn.enrolment_id)
      .maybeSingle(),
    supabase.rpc("balance_after", { p_transaction_id: transactionId }),
    supabase.from("transactions").select("id").eq("reverses_id", transactionId).maybeSingle(),
  ]);
  if (!enrolment?.student || reversal) return null;

  const fmt = schoolFormat(settings);
  const brand = emailBrand(settings);
  const paid = Math.abs(Number(txn.amount));
  const paidBase = Math.abs(Number(txn.amount_base));
  const foreign = txn.currency !== fmt.currency;
  const balance = Number(balanceAfter ?? 0);
  const mail = receiptEmail(brand, {
    studentName: enrolment.student.full_name,
    documentNumber: txn.document_number,
    paidOn: fmt.date(txn.occurred_on),
    forLabel: enrolmentLabel(fmt, enrolment.intake),
    amount: fmt.money(paid, txn.currency),
    equivalent: foreign ? `${fmt.money(paidBase)} at ${txn.rate_to_base} ${txn.currency} per ${fmt.currency}` : null,
    method: methodLabel(txn.method),
    reference: txn.reference,
    balanceAfter: balance < 0 ? `${fmt.money(Math.abs(balance))} in credit` : balance === 0 ? "Paid in full" : fmt.money(balance),
  });
  const to = await resolveRecipient(supabase, enrolment.student.id);
  const result = await deliver(
    supabase,
    brand,
    { kind: "receipt", studentId: enrolment.student.id, enrolmentId: txn.enrolment_id, refId: txn.id, to },
    mail,
  );
  return { ...result, to };
}

/** Emails a student's outstanding balances. Returns null when nothing is owed. */
export async function sendBalanceReminder(supabase: Db, settings: SchoolSettings, studentId: string): Promise<SendResult | null> {
  const [{ data: student }, { data: owing }, { data: enrolments }] = await Promise.all([
    supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle(),
    supabase
      .from("enrolment_balances")
      .select("enrolment_id, balance")
      .eq("student_id", studentId)
      .eq("status", "enrolled")
      .gt("balance", 0),
    supabase
      .from("enrolments")
      .select("id, intake:intakes(label, start_date, course:courses(name))")
      .eq("student_id", studentId),
  ]);
  if (!student || !owing || owing.length === 0) return null;

  const fmt = schoolFormat(settings);
  const brand = emailBrand(settings);
  const intakeById = new Map((enrolments ?? []).map((e) => [e.id, e.intake]));
  const total = owing.reduce((sum, o) => sum + Number(o.balance), 0);
  const mail = balanceReminderEmail(brand, {
    studentName: student.full_name,
    lines: owing.map((o) => ({
      label: enrolmentLabel(fmt, intakeById.get(o.enrolment_id!) ?? null),
      balance: fmt.money(Number(o.balance)),
    })),
    total: fmt.money(total),
  });
  const to = await resolveRecipient(supabase, studentId);
  const result = await deliver(
    supabase,
    brand,
    { kind: "balance_reminder", studentId, enrolmentId: owing.length === 1 ? owing[0].enrolment_id : null, to },
    mail,
  );
  return { ...result, to };
}

export type SweepOptions = {
  /** Don't email a student about overdue instalments again within this many days. */
  repeatDays: number;
  /** Also remind about instalments falling due within this many days (null: overdue only). */
  daysBefore: number | null;
};

export type SweepResult = { students: number; sent: number; dryRun: number; skipped: number; failed: number };

const DAY_MS = 86_400_000;

/**
 * One pass over instalments for the whole school. One email per student at most:
 * overdue instalments first (re-sent only after `repeatDays`), otherwise instalments
 * due soon (sent once per instalment). Pass any Supabase client: the signed-in
 * office user's for the manual button, the service-role client for the cron job.
 */
export async function runReminderSweep(supabase: Db, settings: SchoolSettings, opts: SweepOptions): Promise<SweepResult> {
  const fmt = schoolFormat(settings);
  const brand = emailBrand(settings);
  const today = todayInTimezone(settings.timezone);
  const horizon =
    opts.daysBefore === null ? null : new Date(Date.parse(`${today}T00:00:00Z`) + opts.daysBefore * DAY_MS).toISOString().slice(0, 10);

  const { data: rows } = await supabase
    .from("instalment_status")
    .select(
      "instalment_id, enrolment_id, due_on, outstanding, is_overdue, days_overdue, enrolment:enrolments(status, student:students(id, full_name, status), intake:intakes(label, start_date, course:courses(name)))",
    )
    .eq("is_paid", false)
    .order("due_on");

  type Group = { name: string; enrolmentId: string; overdue: InstalmentItem[]; upcoming: (InstalmentItem & { id: string })[]; firstOverdueId: string | null };
  const groups = new Map<string, Group>();
  for (const r of rows ?? []) {
    const student = r.enrolment?.student;
    if (!student || r.enrolment?.status !== "enrolled" || student.status !== "active" || !r.due_on || !r.instalment_id) continue;
    const item: InstalmentItem = {
      course: enrolmentLabel(fmt, r.enrolment.intake),
      due: fmt.date(r.due_on),
      amount: fmt.money(Number(r.outstanding)),
    };
    const g = groups.get(student.id) ?? { name: student.full_name, enrolmentId: r.enrolment_id!, overdue: [], upcoming: [], firstOverdueId: null };
    if (r.is_overdue) {
      g.overdue.push({ ...item, daysLate: Number(r.days_overdue ?? 0) });
      g.firstOverdueId ??= r.instalment_id;
    } else if (horizon !== null && r.due_on <= horizon && r.due_on >= today) {
      g.upcoming.push({ ...item, id: r.instalment_id });
    }
    groups.set(student.id, g);
  }

  const ids = [...groups.keys()];
  const result: SweepResult = { students: 0, sent: 0, dryRun: 0, skipped: 0, failed: 0 };
  if (ids.length === 0) return result;

  // What each student has already been told. Failed attempts don't count, so they are retried.
  const since = new Date(Date.now() - opts.repeatDays * DAY_MS).toISOString();
  const { data: history } = await supabase
    .from("messages")
    .select("student_id, kind, ref_id, created_at")
    .in("student_id", ids)
    .in("kind", ["instalment_overdue", "instalment_due"])
    .in("status", ["sent", "dry_run", "skipped"]);
  const recentOverdue = new Set<string>();
  const dueSent = new Set<string>();
  for (const m of history ?? []) {
    if (m.kind === "instalment_overdue" && m.created_at >= since && m.student_id) recentOverdue.add(m.student_id);
    if (m.kind === "instalment_due" && m.ref_id) dueSent.add(m.ref_id);
  }

  for (const [studentId, g] of groups) {
    let kind: "instalment_overdue" | "instalment_due";
    let refId: string;
    if (g.overdue.length > 0) {
      if (recentOverdue.has(studentId)) continue;
      kind = "instalment_overdue";
      refId = g.firstOverdueId!;
    } else if (g.upcoming.length > 0) {
      if (dueSent.has(g.upcoming[0].id)) continue;
      kind = "instalment_due";
      refId = g.upcoming[0].id;
    } else {
      continue;
    }

    const to = await resolveRecipient(supabase, studentId);
    const mail = instalmentReminderEmail(brand, { studentName: g.name, overdue: g.overdue, upcoming: g.upcoming });
    const out = await deliver(supabase, brand, { kind, studentId, enrolmentId: g.enrolmentId, refId, to }, mail);
    result.students += 1;
    if (out.status === "sent") result.sent += 1;
    else if (out.status === "dry_run") result.dryRun += 1;
    else if (out.status === "skipped") result.skipped += 1;
    else result.failed += 1;
  }
  return result;
}
