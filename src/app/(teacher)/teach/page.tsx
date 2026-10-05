import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSchool } from "@/lib/school";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, monthYearLabel } from "@/lib/dates";

export default async function TeachHomePage() {
  const { terms: t, displayName } = await requireSchool();
  const supabase = await createClient();
  const { data: classes } = await supabase.rpc("my_classes");
  const rows = classes ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold">My classes</h1>
        <p className="text-[12.5px] text-ink-soft">
          The {t.subject.many.toLowerCase()} you teach, {displayName.split(" ")[0]}.
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            message={`Nothing assigned yet. The office assigns you to a ${t.subject.one.toLowerCase()} on a ${t.intake.one.toLowerCase()} page.`}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <Link key={c.intake_subject_id} href={`/teach/${c.intake_subject_id}`}>
              <Card className="h-full p-5 transition-shadow hover:shadow-[0_2px_10px_rgba(31,27,22,0.1)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-display truncate text-[17px] font-semibold">{c.subject_name}</div>
                    {c.subject_code && <div className="text-[12px] text-ink-soft">{c.subject_code}</div>}
                  </div>
                  <span className="flex flex-none items-center gap-1.5 rounded-full bg-crust-tint px-2.5 py-1 text-[11.5px] font-semibold text-crust-deep">
                    <Users className="h-3.5 w-3.5" />
                    {c.student_count}
                  </span>
                </div>
                <div className="mt-3 text-[13px] text-ink-mid">
                  {c.course_name} · {c.intake_label || monthYearLabel(c.start_date)}
                </div>
                <div className="mt-0.5 text-[12px] text-ink-soft">
                  {formatDate(c.start_date)}
                  {c.end_date ? ` – ${formatDate(c.end_date)}` : ""}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
