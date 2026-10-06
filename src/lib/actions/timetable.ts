"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOT_ALLOWED, getOfficeContext } from "@/lib/school";
import { roomSchema, slotSchema } from "@/lib/validation/timetable";
import type { DialogResult } from "@/lib/types";

type SlotInput = {
  intake_subject_id: string;
  day_of_week: number;
  starts_at: string;
  ends_at: string;
  room_id: string | null;
  term_id: string | null;
};

function refresh() {
  revalidatePath("/timetable");
  revalidatePath("/teach", "layout");
}

/**
 * Creates or edits a weekly slot. The database refuses a slot that overlaps
 * another for the same teacher, room or class; its message names the clash and
 * is passed straight through (error code 23P01).
 */
export async function saveSlot(slotId: string | null, input: SlotInput): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const parsed = slotSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const supabase = await createClient();
  const { error } = slotId
    ? await supabase.from("timetable_slots").update(parsed.data).eq("id", slotId)
    : await supabase.from("timetable_slots").insert(parsed.data);
  if (error) {
    if (error.code === "23P01") return { ok: false, message: error.message };
    return { ok: false, message: "Could not save the slot. Try again." };
  }

  refresh();
  return { ok: true };
}

export async function deleteSlot(slotId: string): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { error } = await supabase.from("timetable_slots").delete().eq("id", slotId);
  if (error) return { ok: false, message: "Could not delete the slot. Try again." };

  refresh();
  return { ok: true };
}

export async function saveRoom(
  roomId: string | null,
  input: { name: string; capacity: string },
): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };
  }
  const row = {
    name: parsed.data.name,
    capacity: parsed.data.capacity === "" ? null : Number(parsed.data.capacity),
  };

  const supabase = await createClient();
  const { error } = roomId
    ? await supabase.from("rooms").update(row).eq("id", roomId)
    : await supabase.from("rooms").insert(row);
  if (error) {
    if (error.code === "23505") return { ok: false, message: "A room with that name already exists." };
    return { ok: false, message: "Could not save the room. Try again." };
  }

  refresh();
  return { ok: true };
}

/** Rooms are archived, not deleted, so past slots keep their room. */
export async function archiveRoom(roomId: string): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { error } = await supabase
    .from("rooms")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", roomId);
  if (error) return { ok: false, message: "Could not archive the room. Try again." };

  refresh();
  return { ok: true };
}
