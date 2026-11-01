import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GripVertical, ChevronDown, Star, ArrowUpToLine } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QueueAttributes from "@/components/queue/QueueAttributes";
import StatusBadge from "@/components/shared/StatusBadge";
import { STATUSES } from "@/lib/taskQueue";

/** One task in the queue. dragHandleProps is set only when manual reordering is active. */
export default function QueueRow({ pending = false, task, parentTitle, projectTitle, dragHandleProps, view = "list", onStatus, onSave, onTop }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`h-full rounded-xl border border-border bg-card ${view === "compact" ? "p-2" : "p-4"}`}>
      <div className="flex items-start gap-2">
        {dragHandleProps
          ? <span {...dragHandleProps} aria-label="Drag to reorder" className="flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground"><GripVertical className="h-4 w-4" /></span>
          : null}
        <div className="min-w-0 flex-1">
          <Link to={`/task-detail?id=${task.id}`} className={`block break-words text-base font-medium leading-6 hover:text-primary ${task.status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>{task.title}</Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {projectTitle && <span>{projectTitle}</span>}
            {parentTitle && <span>↳ {parentTitle}</span>}
            {task.due_date && <span>Due {task.due_date}</span>}
            {task.priority && <StatusBadge value={task.priority} />}
            {task.fun > 0 && <span className="flex shrink-0 items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{task.fun}</span>}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select disabled={pending} value={task.status || "todo"} onValueChange={onStatus}>
          <SelectTrigger className="h-11 min-w-[110px] flex-1 text-sm" aria-label="Task status" aria-busy={pending}><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
        </Select>
        {onTop && (
          <button type="button" aria-label="Move to top" onClick={onTop} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-primary">
            <ArrowUpToLine className="h-4 w-4" />
          </button>
        )}
        <button type="button" aria-label="Edit task details" onClick={() => setOpen(!open)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-primary">
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {pending && <p role="status" className="mt-2 text-xs text-primary">Saving task…</p>}
      {open && <QueueAttributes task={task} onSave={onSave} />}
    </div>
  );
}
