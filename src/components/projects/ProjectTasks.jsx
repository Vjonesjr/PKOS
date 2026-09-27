import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import EmptyState from "@/components/shared/EmptyState";
import { ListTodo } from "lucide-react";

export default function ProjectTasks({ tasks, projectId, onChange }) {
  const [newTitle, setNewTitle] = useState("");

  const add = async () => {
    if (!newTitle.trim()) return;
    await base44.entities.Task.create({ title: newTitle.trim(), project_id: projectId, status: "todo" });
    setNewTitle("");
    onChange();
  };

  const toggleDone = async (task) => {
    await base44.entities.Task.update(task.id, { status: task.status === "done" ? "todo" : "done" });
    onChange();
  };

  return (
    <div className="space-y-2">
      {tasks.length === 0 ? (
        <EmptyState icon={ListTodo} title="No tasks yet" />
      ) : (
        tasks.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
            <Checkbox checked={t.status === "done"} onCheckedChange={() => toggleDone(t)} />
            <span className={`flex-1 text-sm ${t.status === "done" ? "text-muted-foreground line-through" : "text-foreground/90"}`}>{t.title}</span>
          </div>
        ))
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