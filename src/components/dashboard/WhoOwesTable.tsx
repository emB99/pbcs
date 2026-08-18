"use client";

import Link from "next/link";
import { Card, CardHead, CardFoot } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { MoneyCell } from "@/components/ui/MoneyCell";
import { BalanceWithBar } from "@/components/ui/BalanceWithBar";
import { Tag } from "@/components/ui/Tag";
import { CsvExportButton } from "@/components/ui/CsvExportButton";
import { relativeDays, recencyTagVariant } from "@/lib/dates";

export type WhoOwesRow = {
  enrolment_id: string;
  student_id: string;
  full_name: string;
  phone: string;
  course_name: string;
  intake_label: string;
  agreed_price: number;
  charged: number;
  paid: number;
  balance: number;
  last_payment_on: string | null;
};

export function WhoOwesTable({ rows }: { rows: WhoOwesRow[] }) {
  const topRows = rows.slice(0, 7);

  const columns: Column<WhoOwesRow>[] = [
    {
      key: "student",
      header: "Student",
      sortValue: (r) => r.full_name.toLowerCase(),
      render: (r) => (
        <Link href={`/students/${r.student_id}`} className="flex items-center gap-2.5 hover:underline">
          <AvatarInitials id={r.student_id} name={r.full_name} />
          <div>
            <div className="font-semibold">{r.full_name}</div>
            <div className="text-[11.5px] text-ink-soft">{r.phone}</div>
          </div>
        </Link>
      ),
    },
    {
      key: "course",
      header: "Enrolled in",
      render: (r) => (
        <div>
          <div>{r.course_name}</div>
          <div className="text-[11.5px] text-ink-soft">{r.intake_label}</div>
        </div>
      ),
    },
    {
      key: "agreed",
      header: "Agreed",
      align: "right",
      sortValue: (r) => Number(r.agreed_price),
      render: (r) => <MoneyCell amount={r.agreed_price} variant="muted" />,
    },
    {
      key: "paid",
      header: "Paid",
      align: "right",
      sortValue: (r) => Number(r.paid),
      render: (r) => <MoneyCell amount={r.paid} variant="muted" />,
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      sortValue: (r) => Number(r.balance),
      render: (r) => <BalanceWithBar balance={r.balance} charged={r.charged} paid={r.paid} />,
    },
    {
      key: "last_payment",
      header: "Last payment",
      sortValue: (r) => r.last_payment_on ?? "",
      render: (r) => (
        <Tag variant={recencyTagVariant(r.last_payment_on)}>{relativeDays(r.last_payment_on)}</Tag>
      ),
    },
  ];

  return (
    <Card>
      <CardHead title="Who owes money" note="Largest balances first · all amounts USD">
        <Link
          href="/print/outstanding"
          className="rounded-full border border-line bg-surface-2 px-3 py-[6px] text-[11.5px] font-semibold text-ink-mid hover:bg-surface"
        >
          Print list
        </Link>
        <CsvExportButton
          rows={rows}
          filename="who-owes-money.csv"
          columns={[
            { header: "Student", value: (r) => r.full_name },
            { header: "Phone", value: (r) => r.phone },
            { header: "Course", value: (r) => r.course_name },
            { header: "Intake", value: (r) => r.intake_label },
            { header: "Agreed", value: (r) => r.agreed_price },
            { header: "Paid", value: (r) => r.paid },
            { header: "Balance", value: (r) => r.balance },
          ]}
        />
      </CardHead>
      <DataTable
        columns={columns}
        rows={topRows}
        getRowId={(r) => r.enrolment_id}
        emptyMessage="No one owes anything right now."
      />
      {rows.length > topRows.length && (
        <CardFoot>
          <span>
            Showing {topRows.length} of {rows.length} students with a balance
          </span>
          <div className="min-w-3 flex-1" />
          <Link href="/students" className="font-semibold text-crust-deep hover:underline">
            See all
          </Link>
        </CardFoot>
      )}
    </Card>
  );
}
