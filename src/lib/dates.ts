/** "62 days ago", "yesterday", "today" — used for last-payment recency. */
export function relativeDays(isoDate: string | null): string {
  if (!isoDate) return "never";

  const then = new Date(isoDate + "T00:00:00");
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - then.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
}

/** Recency → "late" / "due" / "ok" tag variant for the Tag component. */
export function recencyTagVariant(isoDate: string | null): "late" | "due" | "ok" {
  if (!isoDate) return "late";
  const then = new Date(isoDate + "T00:00:00");
  const now = new Date();
  const diffDays = Math.round((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 30) return "late";
  if (diffDays > 14) return "due";
  return "ok";
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "7 Aug 2026" */
export function formatDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  return dateFormatter.format(new Date(isoDate + "T00:00:00"));
}

/** "Jan 2026" — used to derive an intake label from its start_date. */
export function monthYearLabel(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(
    new Date(isoDate + "T00:00:00"),
  );
}

/** Today's date as a YYYY-MM-DD string, for date input defaults. */
export function todayIsoDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
