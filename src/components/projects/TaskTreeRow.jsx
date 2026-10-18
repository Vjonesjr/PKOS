import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, GripVertical, Plus, ArrowUpToLine } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import TaskSiblings from "@/components/projects/TaskSiblings";

export const MAX_DEPTH = 3; // root + 2 levels of nesting keeps the tree readable on mobile

/**
 * One task with its collapsible subtasks.
 * ctx: { childrenOf, collapsed:Set, toggleCollapsed, onToggle, onAddChild, onTop }
 */
export default function TaskTreeRow({ task, depth = 0, dragHandleProps, ctx }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const kids = ctx.childrenOf(task.id);
  const open = !ctx.collapsed.has(task.id);
  const submit = async () => {
    if (!title.trim()) return setAdding(false);
    await ctx.onAddChild(task, title.trim());
    setTitle(""); setAdding(false);
    if (!open) ctx.toggleCollapsed(task.id);
  };
  const icon = "shrink-0 rounded p-1 text-muted-foreground hover:text-primary";
  return (
    <div className={depth ? "ml-3 border-l border-border pl-2" : ""}>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/40 px-1.5 py-1.5">
        <span {...dragHandleProps} aria-label="Drag to reorder" className="shrink-0 cursor-grab touch-none p-0.5 text-muted-foreground"><GripVertical className="h-4 w-4" /></span>
        {kids.length > 0
          ? <button type="button" aria-label={open ? "Collapse subtasks" : "Expand subtasks"} onClick={() => ctx.toggleCollapsed(task.id)} className={icon}><ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} /></button>
          : <span className="w-[22px] shrink-0" />}
        <Checkbox checked={task.status === "done"} onCheckedChange={() => ctx.onToggle(task)} aria-label="Toggle done" />
        <Link to={`/task-detail?id=${task.id}`} className={`ml-1 min-w-0 flex-1 truncate text-sm hover:text-primary ${task.status === "done" ? "text-muted-foreground line-through" : "text-foreground/90"}`}>{task.title}</Link>
        {kids.length > 0 && <span className="shrink-0 text-[11px] text-muted-foreground">{kids.filter((k) => k.status === "done").length}/{kids.length}</span>}
        <button type="button" aria-label="Move to top" onClick={() => ctx.onTop(task)} className={icon}><ArrowUpToLine className="h-3.5 w-3.5" /></button>
        {depth < MAX_DEPTH - 1 && <button type="button" aria-label="Add subtask" onClick={() => setAdding(true)} className={icon}><Plus className="h-3.5 w-3.5" /></button>}
      </div>
      {adding && (
        <div className="ml-3 mt-1.5">
          <Input autoFocus placeholder="Subtask title" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={submit} onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setAdding(false); }} className="h-8 text-xs" />
        </div>
      )}
      {open && kids.length > 0 && (
        <div className="mt-1.5"><TaskSiblings parentId={task.id} tasks={kids} depth={depth + 1} ctx={ctx} /></div>
      )}
    </div>
  );
}