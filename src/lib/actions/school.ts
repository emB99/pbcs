"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, NOT_ALLOWED, requireSchool } from "@/lib/school";
import { TERM_KEYS } from "@/lib/terminology";
import { schoolSettingsSchema } from "@/lib/validation/team";
import { fieldErrorsFromZod } from "@/lib/validation/shared";
import type { FormState } from "@/lib/types";

export type SchoolFormState = FormState | { saved: true };

export async function updateSchoolSettings(
  _prevState: SchoolFormState,
  formData: FormData,
): Promise<SchoolFormState> {
  const ctx = await requireSchool();
  if (!ADMIN_ROLES.includes(ctx.role)) return { message: NOT_ALLOWED };

  // Terminology overrides arrive as term_<key>_one / term_<key>_many; blanks
  // mean "use the default for this school type", so they're dropped.
  const terminology: Record<string, { one?: string; many?: string }> = {};
  for (const key of TERM_KEYS) {
    const one = String(formData.get(`term_${key}_one`) ?? "").trim();
    const many = String(formData.get(`term_${key}_many`) ?? "").trim();
    if (one || many) terminology[key] = { ...(one && { one }), ...(many && { many }) };
  }

  const parsed = schoolSettingsSchema.safeParse({
    name: formData.get("name"),
    school_type: formData.get("school_type"),
    student_number_prefix: formData.get("student_number_prefix"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    receipt_prefix: formData.get("receipt_prefix") ?? "RCT-",
    invoice_prefix: formData.get("invoice_prefix") ?? "INV-",
    document_footer: formData.get("document_footer") ?? "",
    terminology,
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("school_settings").update(parsed.data).eq("id", true);
  if (error) return { message: "Couldn't save the settings. Try again." };

  revalidatePath("/", "layout");
  return { saved: true };
}
