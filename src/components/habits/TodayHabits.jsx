import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Repeat } from "lucide-react";
import { base44 } from "@/api/base44Client";
import HabitToggle from "@/components/habits/HabitToggle";
import { isDue, ymd } from "@/lib/habits";

/** Due habits for today as one-tap check-ins. */
export default function TodayHabits({ workspace }) {
  const [state, setState] = useState(null);
  const today = ymd(new Date());

  const load = useCallback(async () => {
    const [habits, logs] = await Promise.all([
      base44.entities.Habit.filter({ workspace, active: true }, { limit: 100 }),
      base44.entities.HabitLog.filter({ workspace, date: today }, { limit: 200, fields: ["habit_id", "status"] }),
    ]);
    setState({ habits: habits.items.filter((h) => isDue(h, today)), status: Object.fromEntries(logs.items.map((l) => [l.habit_id, l.status])) });
  }, [workspace, today]);

  useEffect(() => { load(); }, [load]);

  if (!state || !state.habits.length) return null;
  const done = state.habits.filter((h) => state.status[h.id] === "done").length;

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-base font-semibold text-foreground"><Repeat className="h-3.5 w-3.5" /> Habits</p>
        <Link to="/goals?tab=habits" className="text-sm text-muted-foreground hover:text-foreground">{done} of {state.habits.length} done</Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {state.habits.map((h) => <HabitToggle key={h.id} habit={h} status={state.status[h.id]} compact onChanged={load} />)}
      </div>
    </div>
  );
}