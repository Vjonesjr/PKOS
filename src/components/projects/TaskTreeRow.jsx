import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CornerDownRight, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export const MAX_DEPTH = 3; // root + 2 levels of nesting keeps the tree readable on mobile

/** One task with its nested subtasks. childrenOf(id) returns direct children. */
export default function TaskTreeRow({ task, depth = 0, childrenOf, onToggle, onAddChild }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const kids = childrenOf(task.id);
  const submit = async () => {
    if (!title.trim()) return setAdding(false);
    await onAddChild(task, title.trim());
    setTitle(""); setAdding(false);
  };
  return (
    <div className={depth ? "ml-4 border-l border-border pl-2" : ""}>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
        {depth > 0 && <CornerDownRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
        <Checkbox checked={task.status === "done"} onCheckedChange={() => onToggle(task)} aria-label="Toggle done" />
        <Link to={`/task-detail?id=${task.id}`} className={`min-w-0 flex-1 truncate text-sm hover:text-primary ${task.status === "done" ? "text-muted-foreground line-through" : "text-foreground/90"}`}>{task.title}</Link>
        {kids.length > 0 && <span className="shrink-0 text-[11px] text-muted-foreground">{kids.filter((k) => k.status === "done").length}/{kids.length}</span>}
        {depth < MAX_DEPTH - 1 && (
          <button type="button" aria-label="Add subtask" onClick={() => setAdding(true)} className="shrink-0 rounded p-1 text-muted-foreground hover:text-primary"><Plus className="h-3.5 w-3.5" /></button>
        )}
      </div>
      {adding && (
        <div className="ml-4 mt-1.5">
          <Input autoFocus placeholder="Subtask title" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={submit} onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setAdding(false); }} className="h-8 text-xs" />
        </div>
      )}
      {kids.length > 0 && (
        <div className="mt-1.5 space-y-1.5">
          {kids.map((k) => <TaskTreeRow key={k.id} task={k} depth={depth + 1} childrenOf={childrenOf} onToggle={onToggle} onAddChild={onAddChild} />)}
        </div>
      )}
    </div>
  );
}