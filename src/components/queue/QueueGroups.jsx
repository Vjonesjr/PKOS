import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";

/**
 * Renders groups as drop zones. Draggable ids are "<groupValue>::<taskId>" because a task
 * can appear in several context groups at once.
 */
export default function QueueGroups({ groups, draggable, renderRow }) {
  return groups.map((g) => (
    <div key={g.name || "all"} className="space-y-1.5">
      {g.name && <p className="pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.name} · {g.tasks.length}</p>}
      <Droppable droppableId={`g:${g.value}`} isDropDisabled={!draggable}>
        {(p, snap) => (
          <div ref={p.innerRef} {...p.droppableProps} className={`min-h-[2.25rem] space-y-1.5 rounded-lg transition-colors ${snap.isDraggingOver ? "bg-primary/10" : ""} ${g.tasks.length === 0 ? "border border-dashed border-border" : ""}`}>
            {g.tasks.map((t, i) => (
              <Draggable key={`${g.value}::${t.id}`} draggableId={`${g.value}::${t.id}`} index={i} isDragDisabled={!draggable}>
                {(d) => <div ref={d.innerRef} {...d.draggableProps}>{renderRow(t, draggable ? d.dragHandleProps : null)}</div>}
              </Draggable>
            ))}
            {p.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  ));
}