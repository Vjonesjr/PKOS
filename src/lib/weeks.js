import { startOfWeek, subWeeks, format } from "date-fns";

/** ISO week start (Monday) in the user's local timezone, as yyyy-MM-dd. */
export const weekStart = (d = new Date()) => format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
export const weeksAgo = (n) => weekStart(subWeeks(new Date(), n));

export const CHECKIN_STATUSES = [
  { value: "on_track", label: "On track", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40", dot: "bg-emerald-400" },
  { value: "at_risk", label: "At risk", cls: "bg-amber-500/15 text-amber-400 border-amber-500/40", dot: "bg-amber-400" },
  { value: "off_track", label: "Off track", cls: "bg-destructive/15 text-red-400 border-destructive/40", dot: "bg-red-400" },
];
export const statusMeta = (v) => CHECKIN_STATUSES.find((s) => s.value === v);