"use client";

import { useRouter } from "next/navigation";
import type { ReportTerm } from "@/lib/db/reports";

/** Chooses which term a printout covers by reloading the page with ?term=. */
export function PrintTermPicker({
  terms,
  termId,
  basePath,
}: {
  terms: ReportTerm[];
  termId: string | null;
  basePath: string;
}) {
  const router = useRouter();
  if (terms.length === 0) return null;

  return (
    <select
      aria-label="Term"
      value={termId ?? "final"}
      onChange={(e) => router.push(`${basePath}?term=${e.target.value}`)}
      className="rounded-full border border-line bg-surface px-3 py-2 text-[13px]"
    >
      {terms.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name} {t.academic_year}
        </option>
      ))}
      <option value="final">Final results</option>
    </select>
  );
}
