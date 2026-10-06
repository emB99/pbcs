"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { insertCharge } from "@/lib/db/transactions";
import {
  recordPaymentSchema,
  recordChargeSchema,
  reverseTransactionSchema,
  type RecordPaymentInput,
  resolveRate,
} from "@/lib/validation/transactions";
import { fieldErrorsFromZod } from "@/lib/validation/shared";
import { NOT_ALLOWED, getOfficeContext } from "@/lib/school";
import type { DialogResult } from "@/lib/types";

export type RecordPaymentResult =
  | {
      ok: true;
      transactionId: string;
      enrolmentId: string;
      studentId: string;
      balance: number;
    }
  | { ok: false; errors?: Record<string, string[]>; message?: string };

function revalidateAfterMutation(studentId: string | null) {
  revalidatePath("/students");
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  revalidatePath("/intakes");
  if (studentId) revalidatePath(`/students/${studentId}`);
}

export async function recordPayment(input: RecordPaymentInput): Promise<RecordPaymentResult> {
  const ctx = await getOfficeContext();
  if (!ctx) return { ok: false, message: NOT_ALLOWED };

  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: fieldErrorsFromZod(parsed.error) };
  }

  // The school decides which currencies and methods it takes.
  const { base_currency, accepted_currencies, payment_methods } = ctx.settings;
  if (parsed.data.currency !== base_currency && !accepted_currencies.includes(parsed.data.currency)) {
    return { ok: false, errors: { currency: ["This school does not take payments in that currency."] } };
  }
  if (!payment_methods.includes(parsed.data.method)) {
    return { ok: false, errors: { method: ["Choose one of the school's payment methods."] } };
  }
  const rate = resolveRate(parsed.data.currency, base_currency, parsed.data.rate_to_base);
  if (rate === null) {
    return { ok: false, errors: { rate_to_base: ["Enter a valid exchange rate."] } };
  }

  const supabase = await createClient();

  const { data: enrolment } = await supabase
    .from("enrolments")
    .select("student_id")
    .eq("id", parsed.data.enrolment_id)
    .maybeSingle();
  if (!enrolment) {
    return { ok: false, message: "That enrolment couldn't be found." };
  }

  // SIGN CONVENTION: payment < 0. Number() only at this DB-write boundary —
  // parsed.data.amount stays a validated 2-decimal string everywhere else.
  const negativeAmount = -Number(parsed.data.amount);

  const { data: txn, error } = await supabase
    .from("transactions")
    .insert({
      enrolment_id: parsed.data.enrolment_id,
      kind: "payment",
      amount: negativeAmount,
      currency: parsed.data.currency,
      rate_to_base: Number(rate),
      occurred_on: parsed.data.occurred_on,
      method: parsed.data.method,
      reference: parsed.data.reference,
      note: parsed.data.note,
    })
    .select("id")
    .single();

  if (error || !txn) {
    console.error("recordPayment failed:", error?.code, error?.message);
    return { ok: false, message: "Couldn't record the payment. Try again." };
  }

  const { data: balanceRow } = await supabase
    .from("enrolment_balances")
    .select("balance")
    .eq("enrolment_id", parsed.data.enrolment_id)
    .maybeSingle();

  revalidateAfterMutation(enrolment.student_id);

  return {
    ok: true,
    transactionId: txn.id,
    enrolmentId: parsed.data.enrolment_id,
    studentId: enrolment.student_id,
    balance: balanceRow?.balance ?? 0,
  };
}

/** A materials/ingredients fee, or any other one-off charge on an enrolment. */
export async function recordCharge(input: {
  enrolment_id: string;
  amount: string;
  note?: string;
}): Promise<DialogResult> {
  const ctx = await getOfficeContext();
  if (!ctx) return { ok: false, message: NOT_ALLOWED };

  const parsed = recordChargeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the amount." };
  }

  const supabase = await createClient();
  const { data: enrolment } = await supabase
    .from("enrolments")
    .select("student_id")
    .eq("id", parsed.data.enrolment_id)
    .maybeSingle();

  const { error } = await insertCharge(supabase, { ...parsed.data, occurred_on: ctx.fmt.today() });
  if (error) {
    return { ok: false, message: "Couldn't record the charge. Try again." };
  }

  revalidateAfterMutation(enrolment?.student_id ?? null);
  return { ok: true };
}

/**
 * Reversals are always recorded as an `adjustment`, regardless of the
 * original row's kind — the charge/payment check constraints require
 * charges to stay positive and payments to stay negative, so an opposite-
 * signed mirror row can only ever be an adjustment.
 */
export async function reverseTransaction(input: {
  transaction_id: string;
  reversal_reason: string;
}): Promise<DialogResult> {
  const ctx = await getOfficeContext();
  if (!ctx) return { ok: false, message: NOT_ALLOWED };

  const parsed = reverseTransactionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "A reason is required." };
  }

  const supabase = await createClient();
  const { data: original } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", parsed.data.transaction_id)
    .maybeSingle();
  if (!original) {
    return { ok: false, message: "Transaction not found." };
  }

  const { data: enrolment } = await supabase
    .from("enrolments")
    .select("student_id")
    .eq("id", original.enrolment_id)
    .maybeSingle();

  const { error } = await supabase.from("transactions").insert({
    enrolment_id: original.enrolment_id,
    kind: "adjustment",
    amount: Number((-original.amount).toFixed(2)),
    currency: original.currency,
    rate_to_base: original.rate_to_base,
    occurred_on: ctx.fmt.today(),
    method: original.method,
    reference: original.reference,
    reverses_id: original.id,
    reversal_reason: parsed.data.reversal_reason,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "This transaction has already been reversed." };
    }
    return { ok: false, message: "Couldn't reverse the transaction. Try again." };
  }

  revalidateAfterMutation(enrolment?.student_id ?? null);
  return { ok: true };
}
