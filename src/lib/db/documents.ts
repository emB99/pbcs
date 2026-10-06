import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Everything a receipt or invoice needs about one ledger row. Reads run as the
 * caller, so row-level security applies. The balance after a transaction and
 * the enrolment totals come from the database, not from arithmetic here.
 */
export async function loadDocument(transactionId: string) {
  const supabase = await createClient();

  const { data: txn } = await supabase.from("transactions").select("*").eq("id", transactionId).maybeSingle();
  if (!txn) return null;

  const [{ data: enrolment }, { data: reversal }, { data: balanceAfter }, { data: totals }] = await Promise.all([
    supabase
      .from("enrolments")
      .select(
        "id, student:students(id, full_name, student_number, phone, email), intake:intakes(label, start_date, course:courses(name))",
      )
      .eq("id", txn.enrolment_id)
      .maybeSingle(),
    // If this row has been reversed, the document is marked void.
    supabase
      .from("transactions")
      .select("id, occurred_on, reversal_reason")
      .eq("reverses_id", transactionId)
      .maybeSingle(),
    supabase.rpc("balance_after", { p_transaction_id: transactionId }),
    supabase.from("enrolment_balances").select("charged, paid, balance").eq("enrolment_id", txn.enrolment_id).maybeSingle(),
  ]);

  return {
    txn,
    enrolment,
    reversal,
    balanceAfter: Number(balanceAfter ?? 0),
    totals: totals
      ? { charged: Number(totals.charged), paid: Number(totals.paid), balance: Number(totals.balance) }
      : null,
  };
}
