import { makeFormat } from "@/lib/format";

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

/** "7 Aug 2026". Prefer `fmt.date` (the school's locale); this defaults to en-GB. */
export function formatDate(isoDate: string | null, locale = "en-GB"): string {
  return makeFormat({ currency: "USD", locale, timezone: "UTC" }).date(isoDate);
}

/** "Jan 2026". Prefer `fmt.monthYear`; this defaults to en-GB. */
export function monthYearLabel(isoDate: string, locale = "en-GB"): string {
  return makeFormat({ currency: "USD", locale, timezone: "UTC" }).monthYear(isoDate);
}

/** Today's date as a YYYY-MM-DD string, for date input defaults. */
export function todayIsoDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
