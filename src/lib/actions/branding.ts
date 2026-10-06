"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, NOT_ALLOWED, requireSchool } from "@/lib/school";
import { THEME_IDS } from "@/lib/brand";
import type { DialogResult } from "@/lib/types";

const brandingSchema = z.object({
  theme: z.enum(THEME_IDS as [string, ...string[]]),
  brand_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Enter a colour like #4f46e5.")
    .nullable(),
  color_mode: z.enum(["light", "dark", "system"]),
});

async function adminOnly() {
  const ctx = await requireSchool();
  return ADMIN_ROLES.includes(ctx.role);
}

export async function saveBranding(input: {
  theme: string;
  brand_color: string | null;
  color_mode: string;
}): Promise<DialogResult> {
  if (!(await adminOnly())) return { ok: false, message: NOT_ALLOWED };

  const parsed = brandingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("school_settings").update(parsed.data).eq("id", true);
  if (error) return { ok: false, message: "Could not save. Try again." };

  // The theme is applied by the root layout, so refresh everything.
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * The logo is uploaded straight from the browser to the public branding
 * bucket (admins only, by storage policy); this records it and removes the
 * previous file. Only names this app generates are accepted.
 */
export async function setLogo(path: string): Promise<DialogResult> {
  if (!(await adminOnly())) return { ok: false, message: NOT_ALLOWED };
  if (!/^logo-[0-9a-f-]{36}\.(png|jpg|webp)$/.test(path)) return { ok: false, message: "Invalid file." };

  const supabase = await createClient();
  const { data: current } = await supabase.from("school_settings").select("logo_path").maybeSingle();

  const { error } = await supabase.from("school_settings").update({ logo_path: path }).eq("id", true);
  if (error) {
    await supabase.storage.from("branding").remove([path]);
    return { ok: false, message: "Could not save the logo. Try again." };
  }
  if (current?.logo_path && current.logo_path !== path) {
    await supabase.storage.from("branding").remove([current.logo_path]);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeLogo(): Promise<DialogResult> {
  if (!(await adminOnly())) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { data: current } = await supabase.from("school_settings").select("logo_path").maybeSingle();
  const { error } = await supabase.from("school_settings").update({ logo_path: null }).eq("id", true);
  if (error) return { ok: false, message: "Could not remove the logo. Try again." };
  if (current?.logo_path) await supabase.storage.from("branding").remove([current.logo_path]);

  revalidatePath("/", "layout");
  return { ok: true };
}
