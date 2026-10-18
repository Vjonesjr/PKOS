import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { ListTodo } from "lucide-react";
import { base44 } from "@/api/base44Client";
import QueueControls from "@/components/queue/QueueControls";
import QueueRow from "@/components/queue/QueueRow";
import QueueGroups from "@/components/queue/QueueGroups";
import { sortTasks, groupTasks, groupMovePatch, topOrder, MOVABLE_GROUPS } from "@/lib/taskQueue";
import { taskStatusPatch, spawnNextIfRecurring } from "@/lib/taskStatus";

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
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    const query = { workspace, archived: { $ne: true }, ...(projectId ? { project_id: projectId } : {}), ...(showDone ? {} : { status: { $ne: "done" } }) };
    const page = await base44.entities.Task.filter(query, { sort: "sort_order", limit: LIMIT });
    setTasks(page.items);
    // Titles for parents and projects so flattened subtasks keep their context.
    const parentIds = [...new Set(page.items.map((t) => t.parent_task_id).filter(Boolean))];
    const projectIds = [...new Set(page.items.map((t) => t.project_id).filter(Boolean))];
    const [parents, projects] = await Promise.all([
      parentIds.length ? base44.entities.Task.filter({ id: { $in: parentIds } }, { fields: ["title"], limit: LIMIT }) : { items: [] },
      projectIds.length ? base44.entities.Project.filter({ id: { $in: projectIds } }, { fields: ["title"], limit: LIMIT }) : { items: [] },
    ]);
    setNames({ tasks: Object.fromEntries(parents.items.map((p) => [p.id, p.title])), projects: Object.fromEntries(projects.items.map((p) => [p.id, p.title])) });
  }, [workspace, projectId, showDone]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { localStorage.setItem(`${storeKey}_sort`, sort); localStorage.setItem(`${storeKey}_group`, group); }, [sort, group, storeKey]);

  const groups = useMemo(() => (tasks ? groupTasks(sortTasks(tasks, sort), group, names.projects) : []), [tasks, sort, group, names]);
  const canReorder = sort === "manual" && group === "none";
  const canDrag = canReorder || MOVABLE_GROUPS.includes(group);

  const patchLocal = (id, patch) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const save = async (task, patch) => { patchLocal(task.id, patch); await base44.entities.Task.update(task.id, patch); onChange?.(); };
  const setStatus = async (task, status) => {
    await save(task, taskStatusPatch(task, status));
    await spawnNextIfRecurring(task, status);
    if (status === "done" && !showDone) setTasks((ts) => ts.filter((t) => t.id !== task.id));
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
    <QueueRow task={t} parentTitle={names.tasks[t.parent_task_id]} dragHandleProps={handle}
      onStatus={(s) => setStatus(t, s)} onSave={(p) => save(t, p)} onTop={sort === "manual" ? () => moveToTop(t) : null} />
  );

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex items-center gap-2">
        <ListTodo className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {tasks && <span className="text-xs text-muted-foreground">{tasks.length}{tasks.length === LIMIT ? "+" : ""}</span>}
      </div>
      <QueueControls sort={sort} setSort={setSort} group={group} setGroup={setGroup} showDone={showDone} setShowDone={setShowDone} />
      {tasks?.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {canReorder ? "Drag to reorder." : canDrag ? "Drag a task into another group to change it." : "Dragging works in \"My Order\", or when grouped by priority, status, where, or effort."}
        </p>
      )}
      {!tasks ? <p className="py-6 text-center text-xs text-muted-foreground">Loading tasks...</p>
        : tasks.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">No open tasks. Nice.</p>
        : (
          <DragDropContext onDragEnd={onDragEnd}>
            <QueueGroups groups={groups} draggable={canDrag} renderRow={row} />
          </DragDropContext>
        )}
    </div>
  );
}