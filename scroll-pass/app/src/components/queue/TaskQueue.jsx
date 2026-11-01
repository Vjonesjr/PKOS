import {readPreferences} from '@/lib/mvp/preferences';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { ListTodo } from "lucide-react";
import { base44 } from "@/api/base44Client";
import QueueControls from "@/components/queue/QueueControls";
import QueueRow from "@/components/queue/QueueRow";
import QueueGroups from "@/components/queue/QueueGroups";
import { sortTasks, groupTasks, groupMovePatch, topOrder, MOVABLE_GROUPS } from "@/lib/taskQueue";
import { updateTaskStatus, actionError } from "@/lib/taskStatus";

const LIMIT = 100;

/**
 * Home-screen task queue: every open task at every nesting level, flattened.
 * Drag-to-reorder is enabled in "My order" with no grouping; order persists via sort_order.
 */
export default function TaskQueue({ workspace, projectId, title = "My Task Queue", onChange }) {
  const storeKey = projectId ? "project_queue" : "queue";
  const [tasks, setTasks] = useState(null);
  const [names, setNames] = useState({ projects: {}, tasks: {} });
  const [sort, setSort] = useState(() => localStorage.getItem(`${storeKey}_sort`) || "manual");
  const [group, setGroup] = useState(() => localStorage.getItem(`${storeKey}_group`) || "none");
  const [view, setView] = useState(() => localStorage.getItem(`${storeKey}_view`) === "grid" ? "card" : localStorage.getItem(`${storeKey}_view`) || "list");
  const [showDone, setShowDone] = useState(() => localStorage.getItem(`${storeKey}_completed_open`) !== "false");
  const [completed, setCompleted] = useState([]);
  const [pending, setPending] = useState(new Set());
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const query = { workspace, archived: { $ne: true }, ...(projectId ? { project_id: projectId } : {}), status: { $ne: "done" } };
    const [page, finished] = await Promise.all([
      base44.entities.Task.filter(query, { sort: "sort_order", limit: LIMIT }),
      base44.entities.Task.filter({workspace,status:"done",archived:{$ne:true},...(projectId?{project_id:projectId}:{})},{sort:"-updated_date",limit:10}),
    ]);
    const cutoff=Date.now()-readPreferences().completedDays*86400000;
    setCompleted(finished.items.filter(t=>Date.parse(t.completed_date||t.updated_date)>=cutoff));
    setTasks(page.items);
    // Titles for parents and projects so flattened subtasks keep their context.
    const parentIds = [...new Set(page.items.map((t) => t.parent_task_id).filter(Boolean))];
    const projectIds = [...new Set(page.items.map((t) => t.project_id).filter(Boolean))];
    const [parents, projects] = await Promise.all([
      parentIds.length ? base44.entities.Task.filter({ id: { $in: parentIds } }, { fields: ["title"], limit: LIMIT }) : { items: [] },
      projectIds.length ? base44.entities.Project.filter({ id: { $in: projectIds } }, { fields: ["title"], limit: LIMIT }) : { items: [] },
    ]);
    setNames({ tasks: Object.fromEntries(parents.items.map((p) => [p.id, p.title])), projects: Object.fromEntries(projects.items.map((p) => [p.id, p.title])) });
  }, [workspace, projectId]);
  useEffect(() => {
    const refresh = () => load().catch(e => setError(e.message || "Could not load tasks. Please retry."));
    refresh();
    const saved = e => { if(e.detail?.task.workspace === workspace) refresh(); };
    window.addEventListener("pkos:task-saved", saved);
    return () => window.removeEventListener("pkos:task-saved", saved);
  }, [load, workspace]);
  useEffect(() => localStorage.setItem(`${storeKey}_completed_open`, String(showDone)), [storeKey, showDone]);
  useEffect(() => { localStorage.setItem(`${storeKey}_sort`, sort); localStorage.setItem(`${storeKey}_group`, group); localStorage.setItem(`${storeKey}_view`, view); }, [sort, group, view, storeKey]);

  const groups = useMemo(() => (tasks ? groupTasks(sortTasks(tasks, sort), group, names.projects) : []), [tasks, sort, group, names]);
  const canReorder = sort === "manual" && group === "none";
  const canDrag = view === "list" && (canReorder || MOVABLE_GROUPS.includes(group));

  const patchLocal = (id, patch) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const busy = (id, value) => setPending(previous => { const next=new Set(previous); value?next.add(id):next.delete(id); return next; });
  const save = async (task, patch) => {
    if(pending.has(task.id)) return;
    busy(task.id,true); setError("");
    try { await base44.entities.Task.update(task.id,patch); patchLocal(task.id,patch); onChange?.(); }
    catch(e) { setError(e.message||"Could not save this change."); actionError(e.message||"Could not save this change. Please retry."); }
    finally { busy(task.id,false); }
  };
  const setStatus = async (task, status) => {
    if(pending.has(task.id)) return;
    busy(task.id,true);
    try {
      const saved=await updateTaskStatus(task,status);
      if(!saved) return;
      if(status === "done") { setShowDone(true); setCompleted(previous=>[saved,...previous.filter(t=>t.id!==saved.id)].slice(0,10)); setTasks(previous=>previous.filter(t=>t.id!==saved.id)); }
      else patchLocal(task.id,{status});
      onChange?.();
    } finally { busy(task.id,false); }
  };

  // Lowest position wins, so one update puts the task above everything else.
  const moveToTop = (task) => save(task, { sort_order: topOrder(tasks) });

  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (!canReorder) {
      // Grouped view: dropping into another group rewrites that one field.
      if (destination.droppableId === source.droppableId) return;
      const task = tasks.find((t) => t.id === draggableId.split("::")[1]);
      const from = source.droppableId.slice(2), to = destination.droppableId.slice(2);
      if (group === "status") return setStatus(task, to);
      return save(task, groupMovePatch(group, task, from, to));
    }
    if (destination.index === source.index) return;
    const list = sortTasks(tasks, "manual");
    const [moved] = list.splice(source.index, 1);
    list.splice(destination.index, 0, moved);
    const updates = list.map((t, i) => ({ id: t.id, sort_order: (i + 1) * 10 }));
    setTasks(list.map((t, i) => ({ ...t, sort_order: updates[i].sort_order })));
    await base44.entities.Task.bulkUpdate(updates.filter((u, i) => list[i].sort_order !== u.sort_order));
  };

  const row = (t, handle) => (
    <QueueRow pending={pending.has(t.id)} task={t} parentTitle={names.tasks[t.parent_task_id]} projectTitle={names.projects[t.project_id]} dragHandleProps={handle} view={view}
      onStatus={(s) => setStatus(t, s)} onSave={(p) => save(t, p)} onTop={sort === "manual" ? () => moveToTop(t) : null} />
  );

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex items-center gap-2">
        <ListTodo className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {tasks && <span className="text-xs text-muted-foreground">{tasks.length}{tasks.length === LIMIT ? "+" : ""}</span>}
      </div>
      <QueueControls sort={sort} setSort={setSort} group={group} setGroup={setGroup} view={view} setView={setView} showDone={showDone} setShowDone={setShowDone} />
      {tasks?.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {canReorder && canDrag ? "Drag to reorder." : canDrag ? "Drag a task into another group to change it." : view !== "list" ? "Switch to List to drag tasks." : "Dragging works in My Order, or when grouped by priority, status, where, or effort."}
        </p>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}<Button variant="outline" onClick={load}>Retry</Button></p>}
      {!tasks ? <p className="py-6 text-center text-xs text-muted-foreground">Loading tasks...</p>
        : tasks.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">No open tasks. Nice.</p>
        : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-4">
              <QueueGroups groups={groups} storagePrefix={`${storeKey}:${workspace}:${projectId||"all"}:${group}`} draggable={canDrag} renderRow={row} view={view} />
            </div>
          </DragDropContext>
        )}
      <section aria-label="Recent completed tasks" className="border-t border-border pt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-primary"/>Completed tasks</h3><Link to="/completed" className="text-sm text-primary underline">View all completed tasks</Link></div>
        {!showDone ? <p className="text-xs text-muted-foreground">Completed tasks are saved here. Press “Show completed tasks” to see the recent ones.</p> : !completed.length ? <p className="text-xs text-muted-foreground">Your checked-off tasks will appear here.</p> : completed.slice(0,5).map(t => <div key={t.id} className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><div className="min-w-0 flex-1"><Link to={`/task-detail?id=${t.id}`} className="block break-words text-sm line-through text-muted-foreground">{t.title}</Link><p className="mt-1 text-xs text-primary">Completed {t.completed_date || ""}</p></div><Button variant="outline" size="sm" onClick={()=>updateTaskStatus(t,"todo")}>Undo</Button></div>)}
      </section>
    </div>
  );
}
