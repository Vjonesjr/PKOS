import React, { useCallback, useEffect, useState } from "react";
import { Plus, Repeat } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import HabitCard from "@/components/habits/HabitCard";
import HabitForm from "@/components/habits/HabitForm";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { lastNDays, currentStreak } from "@/lib/habits";

export default function HabitsTab() {
  const { workspace } = useWorkspace();
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    const [habits, logs, goals] = await Promise.all([
      base44.entities.Habit.filter({ workspace }, { sort: "-created_date", limit: 100 }),
      base44.entities.HabitLog.filter({ workspace, date: { $gte: lastNDays(90)[0] } }, { limit: 1000, fields: ["habit_id", "date", "status"] }),
      base44.entities.Goal.filter({ workspace }, { limit: 100, fields: ["title"] }),
    ]);
    // Group logs: { habitId: { date: status } }
    const byHabit = {};
    logs.items.forEach((l) => ((byHabit[l.habit_id] ??= {})[l.date] = l.status));
    setData({ habits: habits.items, byHabit, goals: Object.fromEntries(goals.items.map((g) => [g.id, g.title])) });
  }, [workspace]);

  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    if (editing?.id) await base44.entities.Habit.update(editing.id, form);
    else await base44.entities.Habit.create({ ...form, workspace, active: true });
    setEditing(null);
    load();
  };

  const afterLog = async (habit) => {
    await load();
  };

  if (!data) return <p className="py-10 text-center text-sm text-muted-foreground">Loading habits...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing({})} className="gap-1.5"><Plus className="h-4 w-4" /> New habit</Button>
      </div>
      {data.habits.length === 0 ? (
        <EmptyState icon={Repeat} title="No habits yet" description="Add a routine like “Deep work 90 min” and check it off from Today." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.habits.map((h) => {
            const log = data.byHabit[h.id] || {};
            return (
              <HabitCard key={h.id} habit={h} log={log} streak={currentStreak(h, log)} goalTitle={data.goals[h.goal_id]}
                onEdit={() => setEditing(h)} onChanged={() => afterLog(h)} />
            );
          })}
        </div>
      )}
      <HabitForm open={!!editing} onOpenChange={(o) => !o && setEditing(null)} initial={editing?.id ? editing : null} onSave={save} />
    </div>
  );
}