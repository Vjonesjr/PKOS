import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_TASK_DEPTH, normTask } from "@/lib/planImport";

/** Editable nested task list for the import review. */
export default function TaskTreeEditor({ tasks, onChange, depth = 1 }) {
  const set = (i, patch) => onChange(tasks.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  return (
    <div className={`space-y-1.5 ${depth > 1 ? "ml-3 border-l border-border pl-2" : ""}`}>
      {tasks.map((t, i) => (
        <div key={t.key} className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Input value={t.title} onChange={(e) => set(i, { title: e.target.value })} placeholder={depth > 1 ? "Subtask" : "Task"} className="h-8 min-w-0 flex-1 text-xs" />
            <Input type="date" value={t.due_date} onChange={(e) => set(i, { due_date: e.target.value })} className="h-8 w-32 shrink-0 text-xs" aria-label="Task due date" />
            <Button type="button" size="sm" variant="outline" className="min-h-11 shrink-0" onClick={() => { if (window.confirm(`Remove “${t.title || "Untitled task"}”${t.subtasks.length ? " and its subtasks" : ""} from this import?`)) onChange(tasks.filter((_, j) => j !== i)); }}>Remove task</Button>
          </div>
          {(t.subtasks.length > 0 || depth < MAX_TASK_DEPTH) && (
            <TaskTreeEditor tasks={t.subtasks} depth={depth + 1} onChange={(subtasks) => set(i, { subtasks })} />
          )}
        </div>
      ))}
      {depth <= MAX_TASK_DEPTH && (
        <button type="button" onClick={() => onChange([...tasks, normTask({ title: "" }, depth)])} className="flex items-center gap-1 text-xs text-primary">
          <Plus className="h-3 w-3" /> {depth > 1 ? "Add subtask" : "Add task"}
        </button>
      )}
    </div>
  );
}