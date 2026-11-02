import { actionSaved, actionError } from '@/lib/taskStatus';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import StepGenerator from "@/components/shared/StepGenerator";
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export default function MilestoneEditor({ milestones = [], onChange, project, workspace }) {
  const [newTitle, setNewTitle] = useState("");
  const [pending, setPending] = useState(null);

  const toggle = async (idx) => {
    if(pending !== null) return;
    setPending(idx);
    const next=milestones.map((m,i)=>i===idx?{...m,done:!m.done}:m);
    try { await onChange(next); actionSaved(`${next[idx].done?"Milestone completed":"Milestone reopened"}: ${next[idx].title}`); }
    catch(e) { actionError(e.message||"Could not save the milestone. Please retry."); }
    finally { setPending(null); }
  };

  const remove = (idx) => onChange(milestones.filter((_, i) => i !== idx));
  const add = () => {
    if (!newTitle.trim()) return;
    onChange([...milestones, { title: newTitle.trim(), done: false }]);
    setNewTitle("");
  };

  return (
    <div className="space-y-2">
      <DragDropContext onDragEnd={({source, destination}) => { if (!destination || source.index === destination.index) return; const next = [...milestones]; const [item] = next.splice(source.index, 1); next.splice(destination.index, 0, item); onChange(next); }}><Droppable droppableId="project-milestones">{provided => <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
      {milestones.map((m, idx) => <Draggable key={`milestone-${idx}-${m.title}`} draggableId={`milestone-${idx}-${m.title}`} index={idx}>{drag => (
        <div ref={drag.innerRef} {...drag.draggableProps} className="flex items-center gap-2 rounded-lg border border-primary/25 bg-secondary/40 px-3 py-2"><span {...drag.dragHandleProps} aria-label="Drag to reorder milestone" className="flex h-10 w-6 shrink-0 cursor-grab items-center justify-center touch-none"><GripVertical className="h-4 w-4 text-muted-foreground" /></span>
          <Checkbox disabled={pending!==null} aria-busy={pending===idx} checked={!!m.done} onCheckedChange={() => toggle(idx)} />
          <span className={`flex-1 text-sm ${m.done ? "text-muted-foreground line-through" : "text-foreground/90"}`}>{m.title}</span>
          <button aria-label="Remove milestone" onClick={() => remove(idx)} className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}</Draggable>)}{provided.placeholder}</div>}</Droppable></DragDropContext>
      <div className="flex gap-2">
        <Input placeholder="Add milestone" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="h-9" />
        <Button size="sm" onClick={add} className="h-9">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {project?.id && <StepGenerator action="suggest_milestones" workspace={workspace} parentId={project.id} existingTitles={milestones.map((m) => m.title)} label="Suggest milestones with AI" onAccept={async (titles) => { await onChange([...milestones, ...titles.map((title) => ({ title, done: false }))]); }} />}
    </div>
  );
}