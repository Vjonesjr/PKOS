import { format, subDays } from "date-fns";
import { base44 } from "@/api/base44Client";

export const ymd = (d) => format(d, "yyyy-MM-dd");
export const lastNDays = (n) => Array.from({ length: n }, (_, i) => ymd(subDays(new Date(), n - 1 - i)));

/** Is the habit expected on this date? per_week habits are "available" every day. */
export function isDue(habit, dateStr) {
  if (habit.start_date && dateStr < habit.start_date) return false;
  if (habit.schedule_type === "weekdays") return (habit.weekdays || []).includes(new Date(`${dateStr}T12:00:00`).getDay());
  return true;
}

/**
 * Current streak with a grace rule: skips never break it, and one miss per
 * rolling 7 days is forgiven. statusByDate: { "yyyy-MM-dd": "done" | "skipped" | "missed" }.
 */
export function currentStreak(habit, statusByDate, days = 90) {
  let streak = 0;
  let lastGrace = -Infinity;
  for (let i = 0; i < days; i++) {
    const date = ymd(subDays(new Date(), i));
    if (habit.start_date && date < habit.start_date) break;
    const s = statusByDate[date];
    if (s === "done") streak++;
    else if (s === "skipped" || !isDue(habit, date) || habit.schedule_type === "per_week") continue;
    else if (i === 0) continue; // today isn't over yet
    else if (i - lastGrace >= 7) lastGrace = i; // forgive one miss per week
    else break;
  }
  return streak;
}

let ownerId;
const getOwnerId = async () => (ownerId ??= (await base44.auth.me()).id);

/** Set (or clear with status=null) a habit's status for one day. */
export async function setHabitStatus(habit, date, status) {
  if (!status) {
    const { items } = await base44.entities.HabitLog.filter({ habit_id: habit.id, date }, { limit: 5 });
    await Promise.all(items.map((l) => base44.entities.HabitLog.delete(l.id)));
    return;
  }
  await base44.entities.HabitLog.upsert(
    [{ habit_id: habit.id, date, status, owner_id: await getOwnerId(), workspace: habit.workspace }],
    { key: ["habit_id", "date"] }
  );
}