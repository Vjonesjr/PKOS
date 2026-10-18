import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GripVertical, ChevronDown, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QueueAttributes from "@/components/queue/QueueAttributes";
import StatusBadge from "@/components/shared/StatusBadge";
import { STATUSES } from "@/lib/taskQueue";

/** One task in the queue. dragHandleProps is set only when manual reordering is active. */
export default function QueueRow({ task, parentTitle, dragHandleProps, onStatus, onSave }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-card px-2 py-1.5">
      <div className="flex items-center gap-1.5">
        {dragHandleProps
          ? <span {...dragHandleProps} aria-label="Drag to reorder" className="shrink-0 cursor-grab touch-none p-1 text-muted-foreground"><GripVertical className="h-4 w-4" /></span>
          : <span className="w-1" />}
        <div className="min-w-0 flex-1">
          <Link to={`/task-detail?id=${task.id}`} className={`block truncate text-sm hover:text-primary ${task.status === "done" ? "text-muted-foreground line-through" : "text-foreground/90"}`}>{task.title}</Link>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {parentTitle && <span className="truncate">↳ {parentTitle}</span>}
            {task.due_date && <span className="shrink-0">{task.due_date}</span>}
            {task.fun > 0 && <span className="flex shrink-0 items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{task.fun}</span>}
          </div>
        </div>
        <StatusBadge value={task.priority} className="hidden sm:inline-flex" />
        <Select value={task.status || "todo"} onValueChange={onStatus}>
          <SelectTrigger className="h-7 w-[92px] shrink-0 px-2 text-[11px]" aria-label="Task status"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
        </Select>
        <button type="button" aria-label="Edit task details" onClick={() => setOpen(!open)} className="shrink-0 p-1 text-muted-foreground hover:text-primary">
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && <QueueAttributes task={task} onSave={onSave} />}
    </div>
  );
}