import { createClient } from "@/lib/supabase/server";
import { StudentListPanel, type StudentRow } from "@/components/students/StudentListPanel";

/**
 * Scoped to /students/[studentId]/* only — the list "sidebar" appears once
 * you're inside a specific student's record, not on the plain /students
 * list (which stays the full sortable/exportable table).
 */
export default async function StudentDetailLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, phone, archived_at")
    .is("archived_at", null)
    .order("full_name");

  const activeIds = (students ?? []).map((s) => s.id);
  const { data: balances } = await supabase
    .from("student_balances")
    .select("student_id, balance, last_payment_on")
    .in("student_id", activeIds.length > 0 ? activeIds : [""]);
  const balanceById = new Map((balances ?? []).map((b) => [b.student_id, b]));

  const rows: StudentRow[] = (students ?? []).map((s) => ({
    id: s.id,
    full_name: s.full_name,
    phone: s.phone,
    balance: balanceById.get(s.id)?.balance ?? 0,
    last_payment_on: balanceById.get(s.id)?.last_payment_on ?? null,
  }));

  return (
    <div className="flex items-start gap-4 max-[900px]:flex-col">
      <StudentListPanel rows={rows} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
