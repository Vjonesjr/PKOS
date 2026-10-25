import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GripVertical, ChevronDown, Star, ArrowUpToLine } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QueueAttributes from "@/components/queue/QueueAttributes";
import StatusBadge from "@/components/shared/StatusBadge";
import { STATUSES } from "@/lib/taskQueue";

/** One task in the queue. dragHandleProps is set only when manual reordering is active. */
export default function QueueRow({ task, parentTitle, dragHandleProps, view = "list", onStatus, onSave, onTop }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`pk-panel min-w-0 p-4 ${view === "card" ? "min-h-36" : ""}`}> 
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {dragHandleProps
          ? <span {...dragHandleProps} aria-label="Drag to reorder" className="shrink-0 cursor-grab touch-none p-1 text-muted-foreground"><GripVertical className="h-4 w-4" /></span>
          : <span className="w-1" />}
        <div className="min-w-0 flex-1">
          <Link to={`/task-detail?id=${task.id}`} className={`block break-words text-base font-semibold leading-6 hover:text-primary ${task.status === "done" ? "text-muted-foreground line-through" : "text-foreground/90"}`}>{task.title}</Link>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs leading-5 text-muted-foreground">
            {parentTitle && <span className="truncate">↳ {parentTitle}</span>}
            {task.due_date && <span className="shrink-0">{task.due_date}</span>}
            {task.fun > 0 && <span className="flex shrink-0 items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{task.fun}</span>}
          </div>
        </div>
        <StatusBadge value={task.priority} className="hidden sm:inline-flex" />
        <Select value={task.status || "todo"} onValueChange={onStatus}>
          <SelectTrigger className="h-11 w-[118px] shrink-0 px-2 text-xs" aria-label="Task status"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
        </Select>
        {onTop && (
          <button type="button" aria-label="Move to top" onClick={onTop} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary">
            <ArrowUpToLine className="h-4 w-4" />
          </button>
        )}
        <button type="button" aria-label="Edit task details" onClick={() => setOpen(!open)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary">
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && <QueueAttributes task={task} onSave={onSave} />}
    </div>
  );
}