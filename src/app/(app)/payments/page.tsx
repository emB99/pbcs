import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { CsvExportButton } from "@/components/ui/CsvExportButton";
import { formatDate } from "@/lib/dates";
import type { Transaction } from "@/lib/types";

type PaymentRow = Transaction & {
  student_id: string;
  student_name: string;
  course_name: string;
};

const KIND_LABEL: Record<Transaction["kind"], string> = {
  charge: "Charge",
  payment: "Payment",
  adjustment: "Adjustment",
};

export default async function PaymentsPage() {
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300)
    .returns<Transaction[]>();

  const enrolmentIds = [...new Set((transactions ?? []).map((t) => t.enrolment_id))];
  const { data: enrolments } = await supabase
    .from("enrolments")
    .select("id, student_id, intake:intakes(course:courses(name))")
    .in("id", enrolmentIds.length > 0 ? enrolmentIds : [""]);

  const studentIds = [...new Set((enrolments ?? []).map((e) => e.student_id))];
  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .in("id", studentIds.length > 0 ? studentIds : [""]);
  const studentNameById = new Map((students ?? []).map((s) => [s.id, s.full_name]));

  const enrolmentInfoById = new Map(
    (enrolments ?? []).map((e) => [
      e.id,
      { student_id: e.student_id, course_name: e.intake?.course?.name ?? "—" },
    ]),
  );

  const rows: PaymentRow[] = (transactions ?? []).map((t) => {
    const info = enrolmentInfoById.get(t.enrolment_id);
    return {
      ...t,
      student_id: info?.student_id ?? "",
      student_name: info ? (studentNameById.get(info.student_id) ?? "Unknown") : "Unknown",
      course_name: info?.course_name ?? "—",
    };
  });

  const columns: Column<PaymentRow>[] = [
    {
      key: "student",
      header: "Student",
      sortValue: (r) => r.student_name.toLowerCase(),
      render: (r) => (
        <Link href={`/students/${r.student_id}`} className="flex items-center gap-2.5 hover:underline">
          <AvatarInitials id={r.student_id || r.id} name={r.student_name} size="sm" />
          <div>
            <div className="font-semibold">{r.student_name}</div>
            <div className="text-[11.5px] text-ink-soft">{r.course_name}</div>
          </div>
        </Link>
      ),
    },
    {
      key: "kind",
      header: "Kind",
      sortValue: (r) => r.kind,
      render: (r) => (
        <span>
          {KIND_LABEL[r.kind]}
          {r.reverses_id && " (reversal)"}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method / reference",
      render: (r) => (
        <span className="text-ink-mid">
          {[r.method, r.reference].filter(Boolean).join(" · ") || "—"}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortValue: (r) => r.occurred_on,
      render: (r) => <span className="text-ink-mid">{formatDate(r.occurred_on)}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (r) => Number(r.amount_usd),
      render: (r) => {
        const n = Number(r.amount_usd);
        return (
          <span
            className={`money font-semibold ${n < 0 ? "text-sage-ink" : r.reverses_id ? "text-danger" : ""}`}
          >
            {n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Payments</h1>
        <Link href="/payments/new">
          <Button variant="primary" icon={<Plus />}>
            Record a payment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHead title="All transactions" note={`${rows.length} most recent`}>
          <CsvExportButton
            rows={rows}
            filename="payments.csv"
            columns={[
              { header: "Date", value: (r) => r.occurred_on },
              { header: "Student", value: (r) => r.student_name },
              { header: "Course", value: (r) => r.course_name },
              { header: "Kind", value: (r) => r.kind },
              { header: "Method", value: (r) => r.method ?? "" },
              { header: "Reference", value: (r) => r.reference ?? "" },
              { header: "Amount (USD)", value: (r) => r.amount_usd },
              { header: "Currency", value: (r) => r.currency },
              { header: "Reversal reason", value: (r) => r.reversal_reason ?? "" },
            ]}
          />
        </CardHead>
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          emptyMessage="No payments recorded yet."
        />
      </Card>
    </div>
  );
}
