/**
 * Everything that writes money, dates or "today" for a school goes through
 * here, so the school's currency, locale and timezone are applied in one place.
 * Plain (no server-only / client-only code), so server pages and client
 * components share it: servers get a Format from requireSchool(), client
 * components from useFormat().
 */

export type Region = { currency: string; locale: string; timezone: string };

export const DEFAULT_REGION: Region = { currency: "USD", locale: "en-ZW", timezone: "Africa/Harare" };

export type Format = {
  currency: string;
  locale: string;
  timezone: string;
  /** 1234.5 -> "$1,234.50" (the school's currency by default). */
  money: (amount: string | number | null | undefined, currency?: string) => string;
  /** Same, without decimals: dashboard headline figures. */
  moneyWhole: (amount: string | number | null | undefined, currency?: string) => string;
  /** "2026-10-06" -> "6 Oct 2026" (order and month names follow the locale). */
  date: (iso: string | null | undefined) => string;
  /** "2026-10-06" -> "Oct 2026". */
  monthYear: (iso: string) => string;
  /** Today's date in the school's timezone as YYYY-MM-DD. */
  today: () => string;
};

const numberFormats = new Map<string, Intl.NumberFormat>();

function numberFormat(locale: string, currency: string, whole: boolean): Intl.NumberFormat {
  const key = `${locale}|${currency}|${whole}`;
  let nf = numberFormats.get(key);
  if (!nf) {
    const digits = whole ? 0 : 2;
    nf = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    numberFormats.set(key, nf);
  }
  return nf;
}

function toNumber(amount: string | number | null | undefined): number {
  const n = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Date-only values ("YYYY-MM-DD") are calendar dates, not instants, so format them as UTC. */
function asUtcDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

/** Today as YYYY-MM-DD in the given IANA timezone (falls back to UTC if the zone is unknown). */
export function todayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function makeFormat(region: Region): Format {
  const { currency, locale, timezone } = region;
  const dateFormat = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const monthYearFormat = new Intl.DateTimeFormat(locale, { month: "short", year: "numeric", timeZone: "UTC" });

  return {
    currency,
    locale,
    timezone,
    money: (amount, code = currency) => numberFormat(locale, code, false).format(toNumber(amount)),
    moneyWhole: (amount, code = currency) => numberFormat(locale, code, true).format(toNumber(amount)),
    date: (iso) => (iso ? dateFormat.format(asUtcDate(iso)) : "—"),
    monthYear: (iso) => monthYearFormat.format(asUtcDate(iso)),
    today: () => todayInTimezone(timezone),
  };
}

/** The currencies offered when choosing a school's money settings. */
export const CURRENCIES: { code: string; name: string }[] = [
  { code: "USD", name: "US dollar" },
  { code: "ZWG", name: "Zimbabwe Gold" },
  { code: "ZAR", name: "South African rand" },
  { code: "BWP", name: "Botswana pula" },
  { code: "ZMW", name: "Zambian kwacha" },
  { code: "MWK", name: "Malawian kwacha" },
  { code: "MZN", name: "Mozambican metical" },
  { code: "NAD", name: "Namibian dollar" },
  { code: "KES", name: "Kenyan shilling" },
  { code: "UGX", name: "Ugandan shilling" },
  { code: "TZS", name: "Tanzanian shilling" },
  { code: "NGN", name: "Nigerian naira" },
  { code: "GHS", name: "Ghanaian cedi" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British pound" },
  { code: "AUD", name: "Australian dollar" },
  { code: "CAD", name: "Canadian dollar" },
  { code: "INR", name: "Indian rupee" },
];

/** Locales that change how numbers and dates are written. The app's wording stays English. */
export const LOCALES: { code: string; name: string }[] = [
  { code: "en-ZW", name: "English (Zimbabwe)" },
  { code: "en-ZA", name: "English (South Africa)" },
  { code: "en-GB", name: "English (United Kingdom)" },
  { code: "en-US", name: "English (United States)" },
  { code: "en-KE", name: "English (Kenya)" },
  { code: "en-NG", name: "English (Nigeria)" },
  { code: "en-IN", name: "English (India)" },
  { code: "en-AU", name: "English (Australia)" },
  { code: "fr-FR", name: "Français (France)" },
  { code: "pt-PT", name: "Português (Portugal)" },
];

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  ecocash: "EcoCash",
  bank_transfer: "Bank transfer",
  other: "Other",
};

/** Built-in methods are stored as keys; anything a school adds is stored as typed. */
export function methodLabel(method: string | null | undefined): string {
  if (!method) return "";
  return METHOD_LABELS[method] ?? method;
}

const REFERENCE_LABELS: Record<string, string> = {
  cash: "Receipt number",
  ecocash: "EcoCash reference",
  bank_transfer: "Bank reference",
};

export function referenceLabel(method: string): string {
  return REFERENCE_LABELS[method] ?? "Reference";
}

/** True for a well-formed BCP 47 tag such as "en-ZW". */
export function isValidLocale(value: string): boolean {
  try {
    return Intl.getCanonicalLocales(value).length === 1;
  } catch {
    return false;
  }
}

/** True for an IANA timezone this runtime knows, such as "Africa/Harare". */
export function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
