"use client";

import { useMemo, useState, useTransition } from "react";
import { DoorOpen, Trash2 } from "lucide-react";
import { deleteSlot, saveSlot } from "@/lib/actions/timetable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useTerms } from "@/components/school/SchoolProvider";
import { RoomsDialog } from "@/components/timetable/RoomsDialog";
import { WeekGrid, type GridSlot } from "@/components/timetable/WeekGrid";
import { DAY_LABELS, fromMinutes, toMinutes, todayDayOfWeek, trimSeconds } from "@/lib/time";
import type { Room } from "@/lib/types";

export type BoardSlot = {
  id: string;
  day_of_week: number;
  starts_at: string;
  ends_at: string;
  room_id: string | null;
  term_id: string | null;
  intake_subject_id: string;
  intake_id: string;
  instructor_id: string | null;
  subject_name: string;
  intake_label: string;
  teacher_name: string | null;
};

export type BoardClassSubject = {
  id: string;
  intake_id: string;
  instructor_id: string | null;
  subject_name: string;
  intake_label: string;
  course_name: string;
  teacher_name: string | null;
};

export type BoardTerm = { id: string; name: string; academic_year: string };
type Mode = "class" | "teacher" | "room";
type Draft = {
  id: string | null;
  intake_subject_id: string;
  day_of_week: number;
  starts_at: string;
  ends_at: string;
  room_id: string;
  term_id: string;
};

export function TimetableBoard({
  slots,
  classSubjects,
  rooms,
  intakes,
  teachers,
  terms,
}: {
  slots: BoardSlot[];
  classSubjects: BoardClassSubject[];
  rooms: Room[];
  intakes: { id: string; label: string; course_name: string }[];
  teachers: { id: string; full_name: string }[];
  terms: BoardTerm[];
}) {
  const t = useTerms();
  const [mode, setMode] = useState<Mode>("class");
  const [selected, setSelected] = useState<Record<Mode, string>>({
    class: intakes[0]?.id ?? "",
    teacher: teachers[0]?.id ?? "",
    room: rooms[0]?.id ?? "",
  });
  const [termFilter, setTermFilter] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const entityId = selected[mode];

  const visible = useMemo(
    () =>
      slots.filter((s) => {
        if (termFilter && s.term_id && s.term_id !== termFilter) return false;
        if (mode === "class") return s.intake_id === entityId;
        if (mode === "teacher") return s.instructor_id === entityId;
        return s.room_id === entityId;
      }),
    [slots, mode, entityId, termFilter],
  );

  const roomName = (id: string | null) => rooms.find((r) => r.id === id)?.name ?? null;

  const gridSlots: GridSlot[] = visible.map((s) => {
    const room = roomName(s.room_id);
    const subtitle =
      mode === "class"
        ? [s.teacher_name, room].filter(Boolean).join(" · ")
        : mode === "teacher"
          ? [s.intake_label, room].filter(Boolean).join(" · ")
          : [s.intake_label, s.teacher_name].filter(Boolean).join(" · ");
    return {
      id: s.id,
      day: s.day_of_week,
      start: trimSeconds(s.starts_at),
      end: trimSeconds(s.ends_at),
      title: s.subject_name,
      subtitle,
      colorKey: s.subject_name,
    };
  });

  // Which class subjects make sense to offer when adding from this view.
  const pickable = classSubjects.filter((c) =>
    mode === "class" ? c.intake_id === entityId : mode === "teacher" ? c.instructor_id === entityId : true,
  );

  function openNew(day: number, time: string) {
    setError(null);
    setDraft({
      id: null,
      intake_subject_id: pickable[0]?.id ?? "",
      day_of_week: day,
      starts_at: time,
      ends_at: fromMinutes(toMinutes(time) + 60),
      room_id: mode === "room" ? entityId : "",
      term_id: termFilter,
    });
  }

  function openEdit(id: string) {
    const s = slots.find((x) => x.id === id);
    if (!s) return;
    setError(null);
    setDraft({
      id: s.id,
      intake_subject_id: s.intake_subject_id,
      day_of_week: s.day_of_week,
      starts_at: trimSeconds(s.starts_at),
      ends_at: trimSeconds(s.ends_at),
      room_id: s.room_id ?? "",
      term_id: s.term_id ?? "",
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const result = await saveSlot(draft.id, {
        intake_subject_id: draft.intake_subject_id,
        day_of_week: draft.day_of_week,
        starts_at: draft.starts_at,
        ends_at: draft.ends_at,
        room_id: draft.room_id || null,
        term_id: draft.term_id || null,
      });
      if (result.ok) setDraft(null);
      else setError(result.message ?? "Could not save.");
    });
  }

  function remove() {
    if (!draft?.id) return;
    const id = draft.id;
    setError(null);
    startTransition(async () => {
      const result = await deleteSlot(id);
      if (result.ok) setDraft(null);
      else setError(result.message ?? "Could not delete.");
    });
  }

  const entityOptions =
    mode === "class"
      ? intakes.map((i) => ({ id: i.id, label: `${i.course_name} · ${i.label}` }))
      : mode === "teacher"
        ? teachers.map((x) => ({ id: x.id, label: x.full_name }))
        : rooms.map((r) => ({ id: r.id, label: r.name }));

  const pickerOptions = draft?.id
    ? classSubjects.filter((c) => c.id === draft.intake_subject_id || pickable.some((p) => p.id === c.id))
    : pickable;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 border-b border-line-soft px-5 py-3">
        <SegmentedControl<Mode>
          name="View by"
          value={mode}
          onChange={setMode}
          options={[
            { label: `By ${t.intake.one.toLowerCase()}`, value: "class" },
            { label: `By ${t.instructor.one.toLowerCase()}`, value: "teacher" },
            { label: "By room", value: "room" },
          ]}
        />
        <select
          aria-label="Show"
          value={entityId}
          onChange={(e) => setSelected((cur) => ({ ...cur, [mode]: e.target.value }))}
          className="min-w-[200px] rounded-full border border-line bg-surface px-3 py-2 text-[13px]"
        >
          {entityOptions.length === 0 && <option value="">Nothing to show yet</option>}
          {entityOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        {terms.length > 0 && (
          <select
            aria-label={t.term.one}
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            className="rounded-full border border-line bg-surface px-3 py-2 text-[13px]"
          >
            <option value="">All year</option>
            {terms.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} {x.academic_year}
              </option>
            ))}
          </select>
        )}
        <div className="min-w-3 flex-1" />
        <Button icon={<DoorOpen />} onClick={() => setRoomsOpen(true)}>
          Rooms
        </Button>
      </div>

      <p className="px-5 pt-3 text-[12px] text-ink-soft">
        Click an empty space to add a slot, or a slot to edit it.
        {entityOptions.length === 0 && ` Add ${mode === "room" ? "a room" : mode === "teacher" ? `a ${t.instructor.one.toLowerCase()}` : `a ${t.intake.one.toLowerCase()}`} first.`}
      </p>

      <div className="px-3 pt-2 pb-4">
        <WeekGrid
          slots={gridSlots}
          today={todayDayOfWeek()}
          onEmptyClick={entityId ? openNew : undefined}
          onSlotClick={openEdit}
        />
      </div>

      <Dialog open={draft !== null} onClose={() => setDraft(null)} title={draft?.id ? "Edit slot" : "Add a slot"} size="lg">
        {draft && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <FieldGroup label={`${t.subject.one} being taught`} htmlFor="slot_subject">
              <select
                id="slot_subject"
                required
                value={draft.intake_subject_id}
                onChange={(e) => setDraft({ ...draft, intake_subject_id: e.target.value })}
                className={inputClass}
              >
                {pickerOptions.length === 0 && <option value="">No {t.subject.many.toLowerCase()} available</option>}
                {pickerOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.subject_name} — {c.intake_label} ({c.teacher_name ?? `no ${t.instructor.one.toLowerCase()}`})
                  </option>
                ))}
              </select>
            </FieldGroup>

            <div className="grid grid-cols-3 gap-4 max-[520px]:grid-cols-1">
              <FieldGroup label="Day" htmlFor="slot_day">
                <select
                  id="slot_day"
                  value={draft.day_of_week}
                  onChange={(e) => setDraft({ ...draft, day_of_week: Number(e.target.value) })}
                  className={inputClass}
                >
                  {DAY_LABELS.map((d, i) => (
                    <option key={d} value={i + 1}>
                      {d}
                    </option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup label="Starts" htmlFor="slot_start">
                <input
                  id="slot_start"
                  type="time"
                  required
                  value={draft.starts_at}
                  onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
                  className={inputClass}
                />
              </FieldGroup>
              <FieldGroup label="Ends" htmlFor="slot_end">
                <input
                  id="slot_end"
                  type="time"
                  required
                  value={draft.ends_at}
                  onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })}
                  className={inputClass}
                />
              </FieldGroup>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
              <FieldGroup label="Room" htmlFor="slot_room">
                <select
                  id="slot_room"
                  value={draft.room_id}
                  onChange={(e) => setDraft({ ...draft, room_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">No room</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </FieldGroup>
              {terms.length > 0 && (
                <FieldGroup label={`Applies to`} htmlFor="slot_term">
                  <select
                    id="slot_term"
                    value={draft.term_id}
                    onChange={(e) => setDraft({ ...draft, term_id: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">All year</option>
                    {terms.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name} {x.academic_year}
                      </option>
                    ))}
                  </select>
                </FieldGroup>
              )}
            </div>

            {error && <p className="rounded-md bg-danger-tint px-3 py-2 text-[12.5px] text-danger-ink">{error}</p>}

            <div className="flex items-center gap-2">
              {draft.id && (
                <Button type="button" variant="danger" icon={<Trash2 />} onClick={remove} disabled={pending}>
                  Delete
                </Button>
              )}
              <div className="min-w-3 flex-1" />
              <Button type="button" onClick={() => setDraft(null)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={pending || !draft.intake_subject_id}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      <RoomsDialog open={roomsOpen} onClose={() => setRoomsOpen(false)} rooms={rooms} />
    </Card>
  );
}
