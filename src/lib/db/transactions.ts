import "server-only";
import { todayIsoDate } from "@/lib/dates";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Plain server-only helper (not a Server Action itself — takes a Supabase
 * client, which isn't serializable, so it can't live in a "use server"
 * file). Inserts a `charge` transaction. Used by createEnrolment for the
 * course fee, and by the materials/ingredients-fee action — both are just
 * another charge row on the enrolment, per the append-only ledger rule.
 */
export async function insertCharge(
  supabase: SupabaseClient<Database>,
  params: { enrolment_id: string; amount: string; note?: string | null },
) {
  return supabase.from("transactions").insert({
    enrolment_id: params.enrolment_id,
    kind: "charge",
    // Validated 2-decimal string in, Number() only at this DB-write
    // boundary to match the numeric column's wire type — never used for
    // arithmetic, and reads still flow through as string|number everywhere.
    amount: Number(params.amount),
    currency: "USD",
    rate_to_usd: 1,
    occurred_on: todayIsoDate(),
    note: params.note ?? null,
  });
}
