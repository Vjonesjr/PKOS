import React, { useEffect, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Plus, ListTodo, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { updateTaskStatus } from "@/lib/taskStatus";
import { manualOrder, reorder, topOrder } from "@/lib/taskQueue";
import EmptyState from "@/components/shared/EmptyState";
import TaskSiblings from "@/components/projects/TaskSiblings";
import TaskQueue from "@/components/queue/TaskQueue";
import { useWorkspace } from "@/lib/WorkspaceContext";

const VIEWS = [["tree", "Tree"], ["board", "Board"]];

/** Project tasks as a collapsible, draggable tree, or as a sortable/groupable board. */
export default function ProjectTasks({ tasks, projectId, onChange }) {
  const [newTitle, setNewTitle] = useState("");
  const [view, setView] = useState("tree");
  const [list, setList] = useState(tasks);
  const collapseKey = `collapsed_${projectId}`;
  const [collapsed, setCollapsed] = useState(() => new Set(JSON.parse(localStorage.getItem(collapseKey) || "[]")));
  const { workspace } = useWorkspace();
  useEffect(() => setList(tasks), [tasks]);
  useEffect(() => localStorage.setItem(collapseKey, JSON.stringify([...collapsed])), [collapsed, collapseKey]);

  const add = async () => {
    if (!newTitle.trim()) return;
    await base44.entities.Task.create({ title: newTitle.trim(), project_id: projectId, status: "todo", workspace });
    setNewTitle(""); onChange();
  };

  // Tasks whose parent isn't in this project's list are shown as roots so nothing is hidden.
  const ids = new Set(list.map((t) => t.id));
  const parentOf = (t) => (t.parent_task_id && ids.has(t.parent_task_id) ? t.parent_task_id : "root");
  const childrenOf = (id) => list.filter((t) => parentOf(t) === id).sort(manualOrder);

  const ctx = {
    childrenOf, collapsed,
    toggleCollapsed: (id) => setCollapsed((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }),
    onToggle: async (task) => {
      const next = task.status === "done" ? "todo" : "done";
      await updateTaskStatus(task, next);
      onChange();
    },
    onAddChild: async (parent, title) => {
      await base44.entities.Task.create({ title, project_id: projectId, parent_task_id: parent.id, status: "todo", workspace });
      onChange();
    },
    onTop: async (task) => {
      const sort_order = topOrder(childrenOf(parentOf(task)));
      setList((l) => l.map((t) => (t.id === task.id ? { ...t, sort_order } : t)));
      await base44.entities.Task.update(task.id, { sort_order });
    },
  };

  const onDragEnd = async ({ source, destination }) => {
    if (!destination || destination.index === source.index) return;
    const { next, changed } = reorder(childrenOf(source.droppableId.slice(5)), source.index, destination.index);
    const byId = Object.fromEntries(next.map((t) => [t.id, t]));
    setList((l) => l.map((t) => byId[t.id] || t));
    if (changed.length) await base44.entities.Task.bulkUpdate(changed);
  };

  const parents = list.filter((t) => childrenOf(t.id).length);
  const allCollapsed = parents.length > 0 && parents.every((t) => collapsed.has(t.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-primary/25 p-0.5">
          {VIEWS.map(([v, l]) => (
            <button key={v} type="button" onClick={() => setView(v)} className={`rounded-md px-3 py-1 text-xs ${view === v ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>{l}</button>
          ))}
        </div>
        {view === "tree" && parents.length > 0 && (
          <button type="button" onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(parents.map((t) => t.id)))} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            {allCollapsed ? <ChevronsUpDown className="h-3.5 w-3.5" /> : <ChevronsDownUp className="h-3.5 w-3.5" />}
            {allCollapsed ? "Expand All" : "Collapse All"}
          </button>
        )}
      </div>
      {view === "board" ? (
        <TaskQueue workspace={workspace} projectId={projectId} title="Project Tasks" onChange={onChange} />
      ) : list.length === 0 ? (
        <EmptyState icon={ListTodo} title="No Tasks Yet" />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <TaskSiblings parentId="root" tasks={childrenOf("root")} depth={0} ctx={ctx} />
        </DragDropContext>
      )}
      {view === "tree" && (
        <div className="flex gap-2">
          <Input placeholder="Add task" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="h-9" />
          <Button size="sm" onClick={add} className="h-9" aria-label="Add task"><Plus className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}