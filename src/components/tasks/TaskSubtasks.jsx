import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { taskStatusPatch } from "@/lib/taskStatus";

/** Direct subtasks of a task, shown on the task page. New subtasks inherit the parent's project. */
export default function TaskSubtasks({ task, workspace }) {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const load = useCallback(async () => {
    const page = await base44.entities.Task.filter({ parent_task_id: task.id, workspace }, { sort: "created_date", limit: 100 });
    setItems(page.items);
  }, [task.id, workspace]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!title.trim()) return;
    await base44.entities.Task.create({ title: title.trim(), parent_task_id: task.id, project_id: task.project_id || undefined, status: "todo", workspace });
    setTitle(""); load();
  };
  const toggle = async (t) => { await base44.entities.Task.update(t.id, taskStatusPatch(t, t.status === "done" ? "todo" : "done")); load(); };

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card/60 p-5">
      <p className="text-sm font-medium text-foreground">Subtasks {items.length > 0 && <span className="text-muted-foreground">({items.filter((i) => i.status === "done").length}/{items.length})</span>}</p>
      {items.map((t) => (
        <div key={t.id} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
          <Checkbox checked={t.status === "done"} onCheckedChange={() => toggle(t)} aria-label="Toggle done" />
          <Link to={`/task-detail?id=${t.id}`} className={`min-w-0 flex-1 truncate text-sm hover:text-primary ${t.status === "done" ? "text-muted-foreground line-through" : ""}`}>{t.title}</Link>
        </div>
      ))}
      <div className="flex gap-2">
        <Input placeholder="Add subtask" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="h-9" />
        <Button size="sm" onClick={add} className="h-9" aria-label="Add subtask"><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}