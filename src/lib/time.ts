/** Days of the week as stored: 1 = Monday ... 7 = Sunday. */
export const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** "09:30" or "09:30:00" -> minutes since midnight. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m);
}

/** Minutes since midnight -> "09:30". */
export function fromMinutes(total: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, total));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

/** Drops seconds from a Postgres time: "09:30:00" -> "09:30". */
export function trimSeconds(time: string): string {
  return time.slice(0, 5);
}

/** Today as 1..7 (Monday = 1), in the server's / browser's local time. */
export function todayDayOfWeek(): number {
  const js = new Date().getDay(); // 0 = Sunday
  return js === 0 ? 7 : js;
}
