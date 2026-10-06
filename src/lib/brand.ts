/** Placeholder product name, shown until a school has been set up. */
export const PRODUCT_NAME = "School Admin";

export type ThemeId = "neutral" | "warm" | "ocean" | "forest" | "plum";
export type ColorMode = "light" | "dark" | "system";

/**
 * The colour presets a school can choose from. The real values live in
 * globals.css (html[data-theme="…"]); these are only for the picker's
 * swatches and must be kept in step with it.
 */
export const THEMES: { id: ThemeId; label: string; brand: string; canvas: string; surface: string; ink: string }[] = [
  { id: "neutral", label: "Neutral", brand: "#4f46e5", canvas: "#f4f5f7", surface: "#ffffff", ink: "#16181d" },
  { id: "warm", label: "Warm", brand: "#b8651a", canvas: "#f2ebe0", surface: "#fffcf7", ink: "#1f1b16" },
  { id: "ocean", label: "Ocean", brand: "#0e7490", canvas: "#eef3f7", surface: "#ffffff", ink: "#12202b" },
  { id: "forest", label: "Forest", brand: "#2f7d4f", canvas: "#eff3ee", surface: "#fdfefc", ink: "#16211a" },
  { id: "plum", label: "Plum", brand: "#7e3f98", canvas: "#f5f0f6", surface: "#fffdfe", ink: "#221a26" },
];

export const THEME_IDS = THEMES.map((t) => t.id) as ThemeId[];

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a #rrggbb colour. */
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** Text colour that reads best on top of the given brand colour. */
export function onBrandColor(hex: string): "#ffffff" | "#111111" {
  const l = luminance(hex);
  const contrastWhite = 1.05 / (l + 0.05);
  const contrastDark = (l + 0.05) / (luminance("#111111") + 0.05);
  return contrastWhite >= contrastDark ? "#ffffff" : "#111111";
}

/** Contrast ratio of white text on the colour; below 3 it is hard to read as a button. */
export function contrastWithWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

/** Public URL of an uploaded logo in the (public-read) branding bucket. */
export function logoUrl(path: string | null | undefined): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !base) return null;
  return `${base}/storage/v1/object/public/branding/${path}`;
}
