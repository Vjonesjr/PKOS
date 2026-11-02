import { Droppable, Draggable } from '@hello-pangea/dnd';
import PagedTaskGroup from './PagedTaskGroup';

export default function QueueGroups({ groups, draggable, renderRow, view, storagePrefix }) {
  return groups.map(g => <Droppable key={g.name || 'all'} droppableId={`g:${g.value}`} isDropDisabled={!draggable}>
    {(p, snap) => <div ref={p.innerRef} {...p.droppableProps} className={snap.isDraggingOver ? 'rounded-xl bg-primary/10' : ''}>
      <PagedTaskGroup key={`${storagePrefix}:${g.name}`} title={g.name || 'Open tasks'} count={g.tasks.length} storageKey={`pkos-queue-group:${storagePrefix}:${g.name}`} defaultOpen={!['Upcoming','Someday','Later'].includes(g.name)}>
        {limit => <div className={view === 'compact' ? 'space-y-1 p-2' : 'space-y-3 p-3'}>
          {g.tasks.slice(0, limit).map((t, i) => <Draggable key={`${g.value}::${t.id}`} draggableId={`${g.value}::${t.id}`} index={i} isDragDisabled={!draggable}>
            {d => <div ref={d.innerRef} {...d.draggableProps}>{renderRow(t, draggable ? d.dragHandleProps : null)}</div>}
          </Draggable>)}
        </div>}
      </PagedTaskGroup>
      {p.placeholder}
    </div>}
  </Droppable>);
}
