import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a time like 09:30.");

export const slotSchema = z
  .object({
    intake_subject_id: z.string().min(1, "Choose what is being taught."),
    day_of_week: z.number().int().min(1).max(7),
    starts_at: time,
    ends_at: time,
    room_id: z.string().nullable(),
    term_id: z.string().nullable(),
  })
  .refine((s) => s.ends_at > s.starts_at, {
    message: "The end time must be after the start time.",
    path: ["ends_at"],
  });

export const roomSchema = z.object({
  name: z.string().trim().min(1, "Give the room a name.").max(60),
  capacity: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) > 0), { message: "Capacity must be a whole number." }),
});
