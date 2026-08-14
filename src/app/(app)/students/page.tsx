import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { StudentsTable, type StudentRow } from "@/components/students/StudentsTable";

export default async function StudentsPage() {
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
    balance: balanceById.get(s.id)?.balance ?? "0",
    last_payment_on: balanceById.get(s.id)?.last_payment_on ?? null,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Students</h1>
        <Link href="/students/new">
          <Button variant="primary" icon={<Plus />}>
            Add student
          </Button>
        </Link>
      </div>
      <StudentsTable rows={rows} />
    </div>
  );
}
