"use client";

import { DAY_LABELS, fromMinutes, toMinutes } from "@/lib/time";
import { cn } from "@/lib/cn";

export type GridSlot = {
  id: string;
  day: number; // 1 = Monday
  start: string; // "HH:MM"
  end: string;
  title: string;
  subtitle: string;
  /** Any stable string; slots with the same key share a colour. */
  colorKey: string;
};

const HOUR_PX = 56;
const TINTS = [
  "bg-butter text-butter-ink border-butter-ink/25",
  "bg-sage text-sage-ink border-sage-ink/25",
  "bg-sky text-sky-ink border-sky-ink/25",
  "bg-rose text-rose-ink border-rose-ink/25",
  "bg-crust-tint text-crust-deep border-crust/25",
];

function tintFor(key: string) {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

/**
 * A Monday-first week. Weekend columns only appear when something is
 * scheduled on them. Click empty space to add (when onEmptyClick is given),
 * click a slot to open it (when onSlotClick is given).
 */
export function WeekGrid({
  slots,
  today,
  onEmptyClick,
  onSlotClick,
}: {
  slots: GridSlot[];
  /** Highlights this weekday column (1..7). */
  today?: number;
  onEmptyClick?: (day: number, time: string) => void;
  onSlotClick?: (slotId: string) => void;
}) {
  const showWeekend = slots.some((s) => s.day >= 6);
  const days = Array.from({ length: showWeekend ? 7 : 5 }, (_, i) => i + 1);

  const startHour = Math.min(7, ...slots.map((s) => Math.floor(toMinutes(s.start) / 60)));
  const endHour = Math.max(17, ...slots.map((s) => Math.ceil(toMinutes(s.end) / 60)));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const bodyHeight = (endHour - startHour) * HOUR_PX;

  function handleColumnClick(e: React.MouseEvent<HTMLDivElement>, day: number) {
    if (!onEmptyClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const minutesFromTop = ((e.clientY - rect.top) / HOUR_PX) * 60;
    const snapped = Math.floor((startHour * 60 + minutesFromTop) / 30) * 30;
    onEmptyClick(day, fromMinutes(snapped));
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid" style={{ gridTemplateColumns: `48px repeat(${days.length}, minmax(0, 1fr))` }}>
          <div />
          {days.map((d) => (
            <div
              key={d}
              className={cn(
                "border-b border-line-soft px-2 py-2 text-center text-[11px] font-semibold tracking-[0.05em] uppercase",
                today === d ? "text-crust-deep" : "text-ink-soft",
              )}
            >
              {DAY_LABELS[d - 1]}
            </div>
          ))}

          <div className="relative" style={{ height: bodyHeight }}>
            {hours.map((h, i) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[10.5px] text-ink-soft tabular-nums"
                style={{ top: i * HOUR_PX }}
              >
                {i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {days.map((d) => (
            <div
              key={d}
              onClick={(e) => handleColumnClick(e, d)}
              className={cn(
                "relative border-l border-line-soft",
                onEmptyClick && "cursor-cell hover:bg-surface-2/60",
                today === d && "bg-crust-tint/30",
              )}
              style={{
                height: bodyHeight,
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_PX - 1}px, var(--line-soft) ${HOUR_PX - 1}px, var(--line-soft) ${HOUR_PX}px)`,
              }}
            >
              {slots
                .filter((s) => s.day === d)
                .map((s) => {
                  const top = ((toMinutes(s.start) - startHour * 60) / 60) * HOUR_PX;
                  const height = Math.max(22, ((toMinutes(s.end) - toMinutes(s.start)) / 60) * HOUR_PX - 2);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={!onSlotClick}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSlotClick?.(s.id);
                      }}
                      className={cn(
                        "absolute right-1 left-1 overflow-hidden rounded-md border px-2 py-1 text-left text-[11.5px] leading-tight",
                        tintFor(s.colorKey),
                        onSlotClick ? "cursor-pointer hover:brightness-95" : "cursor-default",
                      )}
                      style={{ top, height }}
                    >
                      <div className="truncate font-semibold">{s.title}</div>
                      <div className="truncate opacity-80">{s.subtitle}</div>
                      <div className="truncate opacity-70 tabular-nums">
                        {s.start}–{s.end}
                      </div>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
