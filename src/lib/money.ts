/**
 * Money is never arithmetic'd in JS — Postgres numeric columns are the
 * source of truth and Postgres does the summing. This file only parses user
 * input into a canonical decimal string. Display formatting (currency, locale)
 * lives in format.ts; nothing here does float math on an amount.
 */

const MONEY_INPUT = /^(\d+)(?:\.(\d{1,2}))?$/;

/**
 * Accepts "50", "50.00", "$50", "R 1,250.50", "1 250,5" (a leading currency
 * symbol or code, thousands separators, and a comma decimal are all tolerated)
 * and returns a canonical "50.00"-style decimal string, or null if the input
 * doesn't look like an amount.
 */
export function parseMoneyInput(raw: string): string | null {
  // Drop a leading symbol/code (anything before the first digit) and inner spaces.
  let text = raw.trim().replace(/^[^\d.,-]+/, "").replace(/\s+/g, "");
  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(text)) {
    text = text.replace(/,/g, ""); // 1,250.50 -> 1250.50
  } else if (/^\d+,\d{1,2}$/.test(text)) {
    text = text.replace(",", "."); // 12,50 -> 12.50
  }
  const match = MONEY_INPUT.exec(text);
  if (!match) return null;
  const [, whole, cents] = match;
  return `${whole}.${(cents ?? "00").padEnd(2, "0")}`;
}

/** Percent paid, clamped to [0, 100], rounded to a whole number. */
export function percentPaid(charged: string | number, paid: string | number): number {
  const chargedNum = typeof charged === "string" ? Number(charged) : charged;
  const paidNum = typeof paid === "string" ? Number(paid) : paid;
  if (!Number.isFinite(chargedNum) || chargedNum <= 0) return 0;
  const pct = (paidNum / chargedNum) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}
