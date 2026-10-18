import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import TaskTreeRow from "@/components/projects/TaskTreeRow";

/**
 * One level of the task tree as its own drop zone. The `type` is unique per parent,
 * so a task can only be reordered among its siblings (no accidental re-parenting).
 */
export default function TaskSiblings({ parentId, tasks, depth, ctx }) {
  return (
    <Droppable droppableId={`tree:${parentId}`} type={`tree-${parentId}`}>
      {(p) => (
        <div ref={p.innerRef} {...p.droppableProps} className="space-y-1.5">
          {tasks.map((t, i) => (
            <Draggable key={t.id} draggableId={t.id} index={i}>
              {(d) => (
                <div ref={d.innerRef} {...d.draggableProps}>
                  <TaskTreeRow task={t} depth={depth} dragHandleProps={d.dragHandleProps} ctx={ctx} />
                </div>
              )}
            </Draggable>
          ))}
          {p.placeholder}
        </div>
      )}
    </Droppable>
  );
}