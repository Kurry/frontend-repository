import React, { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { STATUSES } from './App.jsx';

const LANES = [
  { id: 'available', title: 'Available', accepts: [STATUSES.READY, STATUSES.ARCHIVED] },
  { id: 'borrowed', title: 'Borrowed', accepts: [STATUSES.READY] },
  { id: 'conflict', title: 'Conflict Resolution', accepts: [STATUSES.DRAFT, STATUSES.READY, STATUSES.CHANGED] },
];

function SortableItem({ id, record, laneId }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 mb-2 bg-white border rounded shadow-sm cursor-grab active:cursor-grabbing ${isDragging ? 'ring-2 ring-blue-500 z-50' : 'hover:border-blue-300'}`}
      data-testid={`canvas-item-${id}`}
    >
      <div className="font-medium text-sm text-gray-800">{record.title}</div>
      <div className="text-xs text-gray-500 mt-1 flex justify-between">
        <span className="truncate pr-2">{record.author}</span>
        <span className="capitalize bg-gray-100 px-1.5 py-0.5 rounded">{record.status}</span>
      </div>
    </div>
  );
}

function Lane({ lane, items }) {
  return (
    <div className="flex flex-col bg-gray-100 rounded-md overflow-hidden border border-gray-200 min-w-[250px] w-full max-w-[300px]">
      <div className="p-3 bg-gray-200 border-b border-gray-300 font-semibold text-sm text-gray-700 flex justify-between items-center">
        {lane.title}
        <span className="bg-gray-300 px-2 py-0.5 rounded-full text-xs">{items.length}</span>
      </div>
      <div className="p-2 flex-1 min-h-[150px]" data-testid={`lane-${lane.id}`}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <SortableItem key={item.id} id={item.id} record={item} laneId={lane.id} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="h-full w-full flex items-center justify-center text-xs text-gray-400 border-2 border-dashed border-gray-300 rounded">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export default function Canvas({ records, onMove }) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    // Optional: add visual feedback during drag if crossing lanes
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeRecord = records.find(r => r.id === active.id);
    if (!activeRecord) return;

    // Determine the destination lane
    let destLaneId = null;
    const overRecord = records.find(r => r.id === over.id);

    if (overRecord) {
      destLaneId = overRecord.constraintLane;
    } else {
      // Over might be the lane itself if we set up droppable on lanes,
      // but in this simplified setup, we rely on SortableContext which covers the items.
      // If dropping into empty space of a lane, we can check if over.id matches a lane ID.
      if (LANES.find(l => l.id === over.id)) {
        destLaneId = over.id;
      } else {
        // Find if the over.id container belongs to a lane
        const node = over.data?.current?.sortable?.containerId;
        if (node) destLaneId = node;
      }
    }

    // Fallback: search DOM if DndKit didn't resolve lane directly (simple hack for empty lanes without explicit Droppable)
    if(!destLaneId) {
       const overElement = document.elementFromPoint(event.activatorEvent.clientX, event.activatorEvent.clientY);
       const laneEl = overElement?.closest('[data-testid^="lane-"]');
       if(laneEl) {
         destLaneId = laneEl.getAttribute('data-testid').replace('lane-', '');
       }
    }

    if (!destLaneId || activeRecord.constraintLane === destLaneId) return;

    const destLane = LANES.find(l => l.id === destLaneId);
    if (!destLane) return;

    // Check constraints
    if (!destLane.accepts.includes(activeRecord.status)) {
       // Conflict resolution: morph status to a valid one if moving to conflict, or reject
       if (destLaneId === 'conflict') {
         // Moving to conflict lane always forces status to CHANGED
         onMove(active.id, destLaneId, STATUSES.CHANGED);
       } else if (destLaneId === 'available' && activeRecord.constraintLane === 'conflict') {
          // Resolving conflict to available forces READY
         onMove(active.id, destLaneId, STATUSES.READY);
       } else {
         alert(`Cannot move ${activeRecord.title} (${activeRecord.status}) to ${destLane.title}. Invalid constraint.`);
       }
       return;
    }

    // Happy path move
    onMove(active.id, destLaneId, activeRecord.status);
  };

  const activeItem = activeId ? records.find(r => r.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full items-start overflow-x-auto pb-4">
        {LANES.map(lane => (
          <Lane
            key={lane.id}
            lane={lane}
            items={records.filter(r => r.constraintLane === lane.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="p-3 bg-white border border-blue-500 rounded shadow-lg opacity-90 scale-105 origin-top-left cursor-grabbing">
            <div className="font-medium text-sm text-gray-800">{activeItem.title}</div>
            <div className="text-xs text-gray-500 mt-1">{activeItem.author}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
