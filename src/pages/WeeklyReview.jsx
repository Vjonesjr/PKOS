import React, { useState } from "react";
import { addWeeks, subWeeks, format } from "date-fns";
import { ChevronLeft, ChevronRight, CheckSquare, Repeat, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { weekStart } from "@/lib/weeks";
import useWeekActivity from "@/hooks/useWeekActivity";
import StatTile from "@/components/weekly/StatTile";
import WeekList from "@/components/weekly/WeekList";
import GoalVisualizer from "@/components/weekly/GoalVisualizer";

export default function WeeklyReview() {
  const { workspace } = useWorkspace();
  const [week, setWeek] = useState(weekStart());
  const d = new Date(week + "T00:00:00");
  const isCurrent = week === weekStart();
  const { data } = useWeekActivity(workspace, week);
  const consistency = data && data.habitDone + data.habitMissed ? Math.round((data.habitDone / (data.habitDone + data.habitMissed)) * 100) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight pk-grad-text">Weekly review</h1>
        <p className="mt-1 text-sm text-muted-foreground">What you finished, kept up and learned this week.</p>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/25 bg-card/40 pk-glass p-2">
        <Button variant="ghost" size="icon" aria-label="Previous week" onClick={() => setWeek(weekStart(subWeeks(d, 1)))}><ChevronLeft className="h-4 w-4" /></Button>
        <p className="text-sm font-medium text-foreground">{format(d, "MMM d")} – {format(addWeeks(d, 1) - 864e5, "MMM d, yyyy")}</p>
        <Button variant="ghost" size="icon" aria-label="Next week" disabled={isCurrent} onClick={() => setWeek(weekStart(addWeeks(d, 1)))}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      {!data ? <p className="text-sm text-muted-foreground">Loading...</p> : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <StatTile icon={CheckSquare} label="Tasks" value={data.tasks.length} hint="finished" />
            <StatTile icon={Repeat} label="Habits" value={data.habitDone} hint={consistency !== null ? `${consistency}% kept` : "check-offs"} />
            <StatTile icon={BookOpen} label="Lessons" value={data.lessons.length} hint="recorded" />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <WeekList title="Finished tasks" empty="No tasks finished this week." items={data.tasks.map((t) => ({ key: t.id, label: t.title, meta: format(new Date(t.completed_date.slice(0, 10) + "T00:00:00"), "EEE"), to: `/task-detail?id=${t.id}` }))} />
            <WeekList title="Completed habits" empty="No habits checked off this week." items={data.habits.map((h) => ({ key: h.id, label: h.title, meta: `${h.count}×` }))} />
            <WeekList title="Lessons" empty="No lessons recorded this week." items={data.lessons.map((l) => ({ key: l.id, label: l.title || l.learned, to: `/lesson-detail?id=${l.id}` }))} />
          </div>
        </>
      )}
      <GoalVisualizer workspace={workspace} />
    </div>
  );
}