import React, { useState } from "react";
import TaskTreeRow from "@/components/projects/TaskTreeRow";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { taskStatusPatch, spawnNextIfRecurring } from "@/lib/taskStatus";
import EmptyState from "@/components/shared/EmptyState";
import { ListTodo } from "lucide-react";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function ProjectTasks({ tasks, projectId, onChange }) {
  const [newTitle, setNewTitle] = useState("");
  const { workspace } = useWorkspace();

  const add = async () => {
    if (!newTitle.trim()) return;
    await base44.entities.Task.create({ title: newTitle.trim(), project_id: projectId, status: "todo", workspace });
    setNewTitle("");
    onChange();
  };

  const toggleDone = async (task) => {
    const next = task.status === "done" ? "todo" : "done";
    await base44.entities.Task.update(task.id, taskStatusPatch(task, next));
    await spawnNextIfRecurring(task, next);
    onChange();
  };

  const addChild = async (parent, title) => {
    await base44.entities.Task.create({ title, project_id: projectId, parent_task_id: parent.id, status: "todo", workspace });
    onChange();
  };

  // Tasks whose parent isn't in this project's list are shown as roots so nothing is hidden.
  const ids = new Set(tasks.map((t) => t.id));
  const roots = tasks.filter((t) => !t.parent_task_id || !ids.has(t.parent_task_id));
  const childrenOf = (id) => tasks.filter((t) => t.parent_task_id === id);

  return (
    <div className="space-y-2">
      {tasks.length === 0 ? (
        <EmptyState icon={ListTodo} title="No tasks yet" />
      ) : (
        roots.map((t) => <TaskTreeRow key={t.id} task={t} childrenOf={childrenOf} onToggle={toggleDone} onAddChild={addChild} />)
      )}
      <div className="flex gap-2">
        <Input placeholder="Add task" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="h-9" />
        <Button size="sm" onClick={add} className="h-9">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}