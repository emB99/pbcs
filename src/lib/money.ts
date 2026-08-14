/**
 * Money is never arithmetic'd in JS — Postgres numeric columns are the
 * source of truth and Postgres does the summing. This file only parses user
 * input into a canonical decimal string, and formats decimal strings for
 * display. Both directions stay strings; nothing here does float math on an
 * amount.
 */

const MONEY_INPUT = /^\$?\s*(\d+)(?:\.(\d{1,2}))?$/;

/**
 * Accepts "50", "50.00", "$50", "$50.00" (with incidental whitespace) and
 * returns a canonical "50.00"-style decimal string. Returns null if the
 * input doesn't look like an amount.
 */
export function parseMoneyInput(raw: string): string | null {
  const trimmed = raw.trim();
  const match = MONEY_INPUT.exec(trimmed);
  if (!match) return null;
  const [, whole, cents] = match;
  return `${whole}.${(cents ?? "00").padEnd(2, "0")}`;
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats a decimal string (e.g. from a numeric column) as "$1,234.56". */
export function formatUsd(amount: string | number): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return "$0.00";
  return usdFormatter.format(value);
}

/** Percent paid, clamped to [0, 100], rounded to a whole number. */
export function percentPaid(charged: string | number, paid: string | number): number {
  const chargedNum = typeof charged === "string" ? Number(charged) : charged;
  const paidNum = typeof paid === "string" ? Number(paid) : paid;
  if (!Number.isFinite(chargedNum) || chargedNum <= 0) return 0;
  const pct = (paidNum / chargedNum) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}
