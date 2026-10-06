"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Save, X } from "lucide-react";
import { saveRegion } from "@/lib/actions/region";
import { Button } from "@/components/ui/Button";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { CURRENCIES, LOCALES, makeFormat, methodLabel } from "@/lib/format";

type Settings = {
  baseCurrency: string;
  acceptedCurrencies: string[];
  locale: string;
  timezone: string;
  paymentMethods: string[];
};

/** Currency, number/date format, timezone and payment methods for the school. */
export function RegionForm({
  settings,
  timezones,
  baseLocked,
}: {
  settings: Settings;
  timezones: string[];
  /** True once the ledger has transactions; the base currency can no longer change. */
  baseLocked: boolean;
}) {
  const [base, setBase] = useState(settings.baseCurrency);
  const [accepted, setAccepted] = useState<string[]>(settings.acceptedCurrencies);
  const [locale, setLocale] = useState(settings.locale);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [methods, setMethods] = useState<string[]>(settings.paymentMethods);
  const [newMethod, setNewMethod] = useState("");
  const [saved, setSaved] = useState<Settings>(settings);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  // Keep a currency selectable even if it is not in the built-in list.
  const currencyOptions = useMemo(() => {
    const known = new Set(CURRENCIES.map((c) => c.code));
    const extra = [base, ...accepted, settings.baseCurrency]
      .filter((c) => !known.has(c))
      .filter((c, i, all) => all.indexOf(c) === i)
      .map((code) => ({ code, name: code }));
    return [...CURRENCIES, ...extra];
  }, [base, accepted, settings.baseCurrency]);

  const localeOptions = LOCALES.some((l) => l.code === locale) ? LOCALES : [...LOCALES, { code: locale, name: locale }];
  const preview = makeFormat({ currency: base, locale, timezone });
  const sampleDate = preview.today();

  const dirty =
    base !== saved.baseCurrency ||
    locale !== saved.locale ||
    timezone !== saved.timezone ||
    accepted.join() !== saved.acceptedCurrencies.join() ||
    methods.join() !== saved.paymentMethods.join();

  function changeBase(next: string) {
    setBase(next);
    setAccepted((cur) => cur.filter((c) => c !== next));
    setMessage(null);
  }

  function toggleAccepted(code: string, on: boolean) {
    setAccepted((cur) => (on ? [...cur, code] : cur.filter((c) => c !== code)));
    setMessage(null);
  }

  function addMethod() {
    const text = newMethod.trim();
    if (!text || methods.some((m) => methodLabel(m).toLowerCase() === text.toLowerCase())) {
      setNewMethod("");
      return;
    }
    setMethods((cur) => [...cur, text]);
    setNewMethod("");
    setMessage(null);
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveRegion({
        base_currency: base,
        accepted_currencies: accepted,
        locale,
        timezone,
        payment_methods: methods,
      });
      if (result.ok) {
        setSaved({ baseCurrency: base, acceptedCurrencies: accepted, locale, timezone, paymentMethods: methods });
        setMessage({ ok: true, text: "Saved." });
      } else {
        setMessage({ ok: false, text: result.message ?? "Could not save." });
      }
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <FieldGroup label="Base currency" htmlFor="base_currency">
        <select
          id="base_currency"
          value={base}
          onChange={(e) => changeBase(e.target.value)}
          disabled={baseLocked}
          className={inputClass}
        >
          {currencyOptions.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} · {c.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-ink-soft">
          {baseLocked
            ? "Fixed, because transactions already exist: balances are stored in this currency."
            : "Fees, balances and reports are kept in this currency. You can only change it before the first transaction."}
        </p>
      </FieldGroup>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[12.5px] font-semibold text-ink-mid">Other currencies you accept</legend>
        <p className="text-xs text-ink-soft">
          A payment in one of these records its exchange rate into {base}, so the balance stays in one currency.
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
          {currencyOptions
            .filter((c) => c.code !== base)
            .map((c) => (
              <label key={c.code} className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={accepted.includes(c.code)}
                  onChange={(e) => toggleAccepted(c.code, e.target.checked)}
                />
                <span className="font-semibold">{c.code}</span>
                <span className="truncate text-ink-soft">{c.name}</span>
              </label>
            ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Number and date format" htmlFor="locale">
          <select id="locale" value={locale} onChange={(e) => setLocale(e.target.value)} className={inputClass}>
            {localeOptions.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </FieldGroup>
        <FieldGroup label="Timezone" htmlFor="timezone">
          <select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass}>
            {(timezones.includes(timezone) ? timezones : [timezone, ...timezones]).map((z) => (
              <option key={z} value={z}>
                {z.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </FieldGroup>
      </div>

      <p className="rounded-md bg-surface-2 px-4 py-3 text-[13px] text-ink-mid">
        Preview: <strong className="text-ink">{preview.money(1234.5)}</strong> ·{" "}
        <strong className="text-ink">{preview.date(sampleDate)}</strong>
        <span className="text-ink-soft"> (today, in {timezone.replace(/_/g, " ")})</span>
      </p>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[12.5px] font-semibold text-ink-mid">Payment methods</legend>
        <p className="text-xs text-ink-soft">The choices offered when recording a payment. The first one is the default.</p>
        <div className="flex flex-wrap gap-2">
          {methods.map((m) => (
            <span
              key={m}
              className="flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pr-1.5 pl-3 text-[12.5px] font-semibold"
            >
              {methodLabel(m)}
              <button
                type="button"
                onClick={() => setMethods((cur) => cur.filter((x) => x !== m))}
                disabled={methods.length <= 1}
                className="rounded-full p-0.5 text-ink-soft hover:text-danger disabled:opacity-30"
                aria-label={`Remove ${methodLabel(m)}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newMethod}
            maxLength={40}
            placeholder="Add a method, e.g. Mobile money"
            onChange={(e) => setNewMethod(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addMethod();
              }
            }}
            className={`${inputClass} max-w-xs`}
          />
          <Button icon={<Plus />} onClick={addMethod} disabled={!newMethod.trim() || methods.length >= 12}>
            Add
          </Button>
        </div>
      </fieldset>

      {message && <p className={`text-xs ${message.ok ? "text-success-ink" : "text-danger"}`}>{message.text}</p>}

      <div>
        <Button variant="primary" icon={<Save />} onClick={save} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
