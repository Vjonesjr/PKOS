import React from "react";
import { Pencil, Flame, Target, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import HabitDayDot from "@/components/habits/HabitDayDot";
import HabitToggle from "@/components/habits/HabitToggle";
import { base44 } from "@/api/base44Client";
import { lastNDays, isDue } from "@/lib/habits";

const scheduleLabel = (h) =>
  h.schedule_type === "weekdays" ? `${(h.weekdays || []).length} days/week` : h.schedule_type === "per_week" ? `${h.per_week_target}× per week` : "Daily";

export default function HabitCard({ habit, log, streak, goalTitle, onEdit, onChanged }) {
  const days = lastNDays(14);
  const due = days.filter((d) => isDue(habit, d));
  const done = due.filter((d) => log[d] === "done").length;
  const best = Math.max(habit.best_streak || 0, streak);

  const toggleActive = async () => { await base44.entities.Habit.update(habit.id, { active: !habit.active }); onChanged(); };

  return (
    <div className={`rounded-2xl border border-border bg-card/60 p-4 space-y-3 ${habit.active ? "" : "opacity-60"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground break-words">{habit.title}</p>
          <p className="text-xs text-muted-foreground">{scheduleLabel(habit)}{habit.active ? "" : " · paused"}</p>
        </div>
        <div className="flex shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleActive} aria-label={habit.active ? "Pause habit" : "Resume habit"}><Pause className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} aria-label="Edit habit"><Pencil className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {days.map((d) => <HabitDayDot key={d} date={d} status={log[d]} due={isDue(habit, d)} />)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap gap-3 text-muted-foreground">
          <span className="flex items-center gap-1 text-amber-400"><Flame className="h-3.5 w-3.5" /> {streak} (best {best})</span>
          <span>{done} of {due.length} in 2 weeks</span>
          {goalTitle && <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" /> {goalTitle}</span>}
        </div>
        {habit.active && <HabitToggle habit={habit} status={log[days[days.length - 1]]} streak={streak} onChanged={onChanged} />}
      </div>
    </div>
  );
}