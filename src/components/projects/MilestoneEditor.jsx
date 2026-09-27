import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export default function MilestoneEditor({ milestones = [], onChange }) {
  const [newTitle, setNewTitle] = useState("");

  const toggle = (idx) => {
    const next = milestones.map((m, i) => (i === idx ? { ...m, done: !m.done } : m));
    onChange(next);
  };
  const remove = (idx) => onChange(milestones.filter((_, i) => i !== idx));
  const add = () => {
    if (!newTitle.trim()) return;
    onChange([...milestones, { title: newTitle.trim(), done: false }]);
    setNewTitle("");
  };

  return (
    <div className="space-y-2">
      {milestones.map((m, idx) => (
        <div key={idx} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
          <Checkbox checked={!!m.done} onCheckedChange={() => toggle(idx)} />
          <span className={`flex-1 text-sm ${m.done ? "text-muted-foreground line-through" : "text-foreground/90"}`}>{m.title}</span>
          <button onClick={() => remove(idx)} className="text-muted-foreground hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input placeholder="Add milestone" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="h-9" />
        <Button size="sm" onClick={add} className="h-9">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}