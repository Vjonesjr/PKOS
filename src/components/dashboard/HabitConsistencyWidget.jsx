import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Repeat } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Widget from "@/components/dashboard/Widget";
import { isDue, lastNDays } from "@/lib/habits";

/** Last 7 days: done vs. due per habit (per_week habits use their weekly target). */
export default function HabitConsistencyWidget({ workspace }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    const days = lastNDays(7);
    Promise.all([
      base44.entities.Habit.filter({ workspace, active: true }, { limit: 50 }),
      base44.entities.HabitLog.aggregate({ query: { workspace, status: "done", date: { $gte: days[0] } }, groupBy: "habit_id" }),
    ]).then(([h, agg]) => {
      const done = Object.fromEntries(agg.rows.map((r) => [r.habit_id, r.count]));
      setRows(h.items.map((habit) => {
        const due = habit.schedule_type === "per_week" ? habit.per_week_target || 1 : days.filter((d) => isDue(habit, d)).length;
        return { habit, done: done[habit.id] || 0, due };
      }));
    });
  }, [workspace]);

  const totalDue = rows?.reduce((a, r) => a + r.due, 0) || 0;
  const totalDone = rows?.reduce((a, r) => a + Math.min(r.done, r.due), 0) || 0;

  return (
    <Widget title="Habits · this week" icon={Repeat}>
      {!rows ? <p className="text-xs text-muted-foreground">Loading...</p> : !rows.length ? (
        <Link to="/goals?tab=habits" className="block rounded-lg border border-dashed border-primary/25 p-3 text-center text-sm text-muted-foreground">Add a habit →</Link>
      ) : (
        <div className="space-y-2">
          <p className="text-2xl font-semibold text-foreground">{totalDue ? Math.round((totalDone / totalDue) * 100) : 0}%<span className="ml-1 text-xs font-normal text-muted-foreground">consistency</span></p>
          {rows.slice(0, 5).map((r) => (
            <div key={r.habit.id} className="flex justify-between gap-2 text-xs">
              <span className="truncate text-foreground/90">{r.habit.title}</span>
              <span className="shrink-0 text-muted-foreground">{Math.min(r.done, r.due)} of {r.due}</span>
            </div>
          ))}
        </div>
      )}
    </Widget>
  );
}