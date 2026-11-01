import PagedTaskGroup from '@/components/queue/PagedTaskGroup';
import {useWorkspace} from '@/lib/WorkspaceContext';
import { useState } from "react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";

export default function TodayList({ tasks, onToggle, onRemove }) {
  const [pending,setPending]=useState("");
  const {workspace}=useWorkspace();
  const toggle=async task=>{if(pending)return;setPending(task.id);try{await onToggle(task);}finally{setPending("");}};
  return (
    <PagedTaskGroup title="My Today List" count={tasks.length} storageKey={`pkos-today-group:${workspace}`} >
      {limit => (
        <div className="space-y-1.5">
          {tasks.slice(0,limit).map((t) => (
            <div key={t.id} className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-start gap-3">
              <Checkbox checked={t.status === "done"} disabled={!!pending} aria-busy={pending===t.id} onCheckedChange={() => toggle(t)} aria-label={t.status === "done" ? "Mark incomplete" : "Mark done"} />
              <Link to={`/task-detail?id=${t.id}`} className={`min-w-0 flex-1 break-words text-base leading-6 hover:text-primary ${t.status === "done" ? "text-muted-foreground line-through" : "text-foreground/90"}`}>{t.title}</Link>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
              {t.scheduled_time && <span className="text-sm font-medium text-primary">{t.scheduled_time}</span>}
              {pending===t.id ? <span role="status" className="text-xs text-primary">Saving…</span> : t.status === "done" ? <span className="text-xs font-semibold text-primary">Completed</span> : <StatusBadge value={t.priority} />}
              <Button size="sm" variant="outline" className="min-h-11 ml-auto text-sm" disabled={!!pending} onClick={async () => { setPending(t.id); try { await onRemove(t); } finally { setPending(""); } }}>Remove from Today</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PagedTaskGroup>
  );
}