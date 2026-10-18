import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ListTodo } from "lucide-react";
import { base44 } from "@/api/base44Client";
import QueueControls from "@/components/queue/QueueControls";
import QueueRow from "@/components/queue/QueueRow";
import { sortTasks, groupTasks } from "@/lib/taskQueue";
import { taskStatusPatch, spawnNextIfRecurring } from "@/lib/taskStatus";

const LIMIT = 100;

/**
 * Home-screen task queue: every open task at every nesting level, flattened.
 * Drag-to-reorder is enabled in "My order" with no grouping; order persists via sort_order.
 */
export default function TaskQueue({ workspace }) {
  const [tasks, setTasks] = useState(null);
  const [names, setNames] = useState({ projects: {}, tasks: {} });
  const [sort, setSort] = useState(() => localStorage.getItem("queue_sort") || "manual");
  const [group, setGroup] = useState(() => localStorage.getItem("queue_group") || "none");
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    const query = { workspace, archived: { $ne: true }, ...(showDone ? {} : { status: { $ne: "done" } }) };
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
  }, [workspace, showDone]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { localStorage.setItem("queue_sort", sort); localStorage.setItem("queue_group", group); }, [sort, group]);

  const groups = useMemo(() => (tasks ? groupTasks(sortTasks(tasks, sort), group, names.projects) : []), [tasks, sort, group, names]);
  const canDrag = sort === "manual" && group === "none";

  const patchLocal = (id, patch) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const save = async (task, patch) => { patchLocal(task.id, patch); await base44.entities.Task.update(task.id, patch); };
  const setStatus = async (task, status) => {
    await save(task, taskStatusPatch(task, status));
    await spawnNextIfRecurring(task, status);
    if (status === "done" && !showDone) setTasks((ts) => ts.filter((t) => t.id !== task.id));
  };

  const onDragEnd = async ({ source, destination }) => {
    if (!destination || destination.index === source.index) return;
    const list = sortTasks(tasks, "manual");
    const [moved] = list.splice(source.index, 1);
    list.splice(destination.index, 0, moved);
    const updates = list.map((t, i) => ({ id: t.id, sort_order: (i + 1) * 10 }));
    setTasks(list.map((t, i) => ({ ...t, sort_order: updates[i].sort_order })));
    await base44.entities.Task.bulkUpdate(updates.filter((u, i) => list[i].sort_order !== u.sort_order));
  };

  const row = (t, handle) => (
    <QueueRow task={t} parentTitle={names.tasks[t.parent_task_id]} dragHandleProps={handle}
      onStatus={(s) => setStatus(t, s)} onSave={(p) => save(t, p)} />
  );

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex items-center gap-2">
        <ListTodo className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">My task queue</h2>
        {tasks && <span className="text-xs text-muted-foreground">{tasks.length}{tasks.length === LIMIT ? "+" : ""}</span>}
      </div>
      <QueueControls sort={sort} setSort={setSort} group={group} setGroup={setGroup} showDone={showDone} setShowDone={setShowDone} />
      {!canDrag && tasks?.length > 0 && <p className="text-[11px] text-muted-foreground">Switch to "My order" with no grouping to drag tasks.</p>}
      {!tasks ? <p className="py-6 text-center text-xs text-muted-foreground">Loading tasks...</p>
        : tasks.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">No open tasks. Nice.</p>
        : canDrag ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="queue">
              {(p) => (
                <div ref={p.innerRef} {...p.droppableProps} className="space-y-1.5">
                  {groups[0][1].map((t, i) => (
                    <Draggable key={t.id} draggableId={t.id} index={i}>
                      {(d) => <div ref={d.innerRef} {...d.draggableProps}>{row(t, d.dragHandleProps)}</div>}
                    </Draggable>
                  ))}
                  {p.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : groups.map(([name, list]) => (
          <div key={name} className="space-y-1.5">
            {name && <p className="pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{name} · {list.length}</p>}
            {list.map((t) => <div key={`${name}-${t.id}`}>{row(t)}</div>)}
          </div>
        ))}
    </div>
  );
}