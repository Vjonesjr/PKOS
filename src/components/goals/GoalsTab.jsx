import React, { useCallback, useEffect, useState } from "react";
import { Plus, Target } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import GoalCard from "@/components/goals/GoalCard";
import GoalForm from "@/components/goals/GoalForm";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function GoalsTab() {
  const { workspace } = useWorkspace();
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null); // null = closed, {} = new

  const load = useCallback(async () => {
    const [goals, projects, habits] = await Promise.all([
      base44.entities.Goal.filter({ workspace }, { sort: "-updated_date", limit: 50 }),
      base44.entities.Project.filter({ workspace, goal_id: { $exists: true } }, { limit: 200, fields: ["goal_id", "status", "progress", "title"] }),
      base44.entities.Habit.filter({ workspace, active: true }, { limit: 100, fields: ["goal_id"] }),
    ]);
    setData({ goals: goals.items, projects: projects.items, habits: habits.items });
  }, [workspace]);

  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    if (editing?.id) await base44.entities.Goal.update(editing.id, form);
    else await base44.entities.Goal.create({ ...form, workspace });
    setEditing(null);
    load();
  };

  if (!data) return <p className="py-10 text-center text-sm text-muted-foreground">Loading goals...</p>;
  const activeCount = data.goals.filter((g) => g.status === "Active").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{activeCount} active</p>
        <Button size="sm" onClick={() => setEditing({})} className="gap-1.5"><Plus className="h-4 w-4" /> New goal</Button>
      </div>
      {activeCount > 5 && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          You have {activeCount} active goals. Consider pausing some — focus beats breadth.
        </p>
      )}
      {data.goals.length === 0 ? (
        <EmptyState icon={Target} title="Set your first goal" description="Link projects and habits to it, and progress rolls up automatically." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.goals.map((g) => (
            <GoalCard key={g.id} goal={g} projects={data.projects.filter((p) => p.goal_id === g.id)}
              habitCount={data.habits.filter((h) => h.goal_id === g.id).length} onEdit={() => setEditing(g)} />
          ))}
        </div>
      )}
      <GoalForm open={!!editing} onOpenChange={(o) => !o && setEditing(null)} initial={editing?.id ? editing : null} onSave={save} />
    </div>
  );
}