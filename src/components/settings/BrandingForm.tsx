"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, RotateCcw, Save } from "lucide-react";
import { saveBranding } from "@/lib/actions/branding";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { THEMES, contrastWithWhite, isHexColor, luminance, onBrandColor, type ColorMode, type ThemeId } from "@/lib/brand";
import { cn } from "@/lib/cn";

type Saved = { theme: ThemeId; brandColor: string | null; colorMode: ColorMode };

/**
 * Theme, brand colour and light/dark mode. Changes preview live across the
 * whole app (by setting the same attributes the root layout sets) and are
 * undone if you leave without saving.
 */
export function BrandingForm({ saved: initial }: { saved: Saved }) {
  const [saved, setSaved] = useState<Saved>(initial);
  const [theme, setTheme] = useState<ThemeId>(initial.theme);
  const [brandColor, setBrandColor] = useState<string | null>(initial.brandColor);
  const [mode, setMode] = useState<ColorMode>(initial.colorMode);
  const [hexText, setHexText] = useState(initial.brandColor ?? "");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  // Mirror of `saved` for the unmount cleanup (refs may only be touched in effects).
  const savedRef = useRef(saved);
  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);

  const preset = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  const effectiveBrand = brandColor ?? preset.brand;
  const dirty = theme !== saved.theme || brandColor !== saved.brandColor || mode !== saved.colorMode;

  // Live preview: mirror what the root layout renders on <html>.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.mode = mode;
    if (brandColor) {
      root.style.setProperty("--brand", brandColor);
      root.style.setProperty("--on-brand", onBrandColor(brandColor));
    } else {
      root.style.removeProperty("--brand");
      root.style.removeProperty("--on-brand");
    }
  }, [theme, brandColor, mode]);

  // Leaving without saving restores what is saved.
  useEffect(() => {
    return () => {
      const s = savedRef.current;
      const root = document.documentElement;
      root.dataset.theme = s.theme;
      root.dataset.mode = s.colorMode;
      if (s.brandColor) {
        root.style.setProperty("--brand", s.brandColor);
        root.style.setProperty("--on-brand", onBrandColor(s.brandColor));
      } else {
        root.style.removeProperty("--brand");
        root.style.removeProperty("--on-brand");
      }
    };
  }, []);

  function pickColor(value: string) {
    setHexText(value);
    if (isHexColor(value)) {
      setBrandColor(value.toLowerCase());
      setMessage(null);
    }
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveBranding({ theme, brand_color: brandColor, color_mode: mode });
      if (result.ok) {
        setSaved({ theme, brandColor, colorMode: mode });
        setMessage({ ok: true, text: "Saved." });
      } else {
        setMessage({ ok: false, text: result.message ?? "Could not save." });
      }
    });
  }

  function discard() {
    setTheme(saved.theme);
    setBrandColor(saved.brandColor);
    setMode(saved.colorMode);
    setHexText(saved.brandColor ?? "");
    setMessage(null);
  }

  const lightBrand = luminance(effectiveBrand) > 0.5;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-[12.5px] font-semibold text-ink-mid">Colour theme</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEMES.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                aria-pressed={active}
                className={cn(
                  "relative overflow-hidden rounded-md border text-left transition-shadow",
                  active ? "border-brand shadow-focus" : "border-line hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
                )}
              >
                <div className="flex h-16 items-end gap-1.5 p-2" style={{ background: t.canvas }}>
                  <div className="h-8 w-8 rounded-md" style={{ background: t.brand }} />
                  <div className="flex-1 space-y-1 rounded-md p-1.5" style={{ background: t.surface }}>
                    <div className="h-1.5 w-3/4 rounded-full" style={{ background: t.ink, opacity: 0.8 }} />
                    <div className="h-1.5 w-1/2 rounded-full" style={{ background: t.ink, opacity: 0.3 }} />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-surface px-3 py-2 text-[12.5px] font-semibold">
                  {t.label}
                  {active && <Check className="h-4 w-4 text-brand-deep" />}
                </div>
              </button>
            );
          })}
        </div>
      </fieldset>

      <FieldGroup label="Brand colour" htmlFor="brand_hex">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="color"
            aria-label="Pick a brand colour"
            value={effectiveBrand}
            onChange={(e) => pickColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-md border border-line bg-surface p-1"
          />
          <input
            id="brand_hex"
            value={hexText}
            maxLength={7}
            placeholder={`${preset.brand} (theme colour)`}
            onChange={(e) => pickColor(e.target.value)}
            className={`${inputClass} w-56`}
          />
          <Button
            type="button"
            icon={<RotateCcw />}
            onClick={() => {
              setBrandColor(null);
              setHexText("");
            }}
            disabled={brandColor === null}
          >
            Use theme colour
          </Button>
        </div>
        <p className="text-xs text-ink-soft">
          Buttons, highlights and the active menu item use this colour. Leave it blank to use the theme&apos;s own.
        </p>
        {hexText !== "" && !isHexColor(hexText) && (
          <p className="text-xs text-danger">Use a six-digit colour like #4f46e5.</p>
        )}
        {lightBrand && contrastWithWhite(effectiveBrand) < 3 && (
          <p className="text-xs text-warning-ink">
            This is a very light colour. Text on buttons switches to dark automatically, but links and highlights
            can be hard to read on a white background.
          </p>
        )}
      </FieldGroup>

      <FieldGroup label="Appearance" htmlFor="mode">
        <SegmentedControl<ColorMode>
          name="Appearance"
          value={mode}
          onChange={setMode}
          options={[
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
            { label: "Match device", value: "system" },
          ]}
        />
        <p className="text-xs text-ink-soft">Printed pages are always light.</p>
      </FieldGroup>

      {message && <p className={`text-xs ${message.ok ? "text-success-ink" : "text-danger"}`}>{message.text}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" icon={<Save />} onClick={save} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save appearance"}
        </Button>
        {dirty && (
          <Button onClick={discard} disabled={pending}>
            Discard changes
          </Button>
        )}
        {dirty && <span className="text-xs text-ink-soft">Previewing. Not saved yet.</span>}
      </div>
    </div>
  );
}
