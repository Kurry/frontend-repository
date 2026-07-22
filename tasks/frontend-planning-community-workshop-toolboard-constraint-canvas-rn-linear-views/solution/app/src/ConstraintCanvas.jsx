import React, { useState } from 'react';
import { useStore } from './store.jsx';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from './utils';
import { GripVertical } from 'lucide-react';

const LANE_CAPACITY = {
  'backlog': 100,
  'in-progress': 2,
  'review': 3,
  'done': 100
};

const SortableItem = ({ id, record, isDragging }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white border rounded p-3 mb-2 shadow-sm flex flex-col gap-1 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50",
        record.status === 'changed' && "border-blue-400 bg-blue-50"
      )}
    >
      <div className="flex items-center justify-between">
         <span className="font-semibold text-sm">{record.name}</span>
         <GripVertical size={16} className="text-gray-400" />
      </div>
      <span className="text-xs text-gray-500 uppercase">{record.status}</span>
    </div>
  );
};

const Lane = ({ id, title, records, activeId }) => {
  const capacity = LANE_CAPACITY[id];
  const isOverCapacity = records.length > capacity;
  return (
    <div className="flex-1 min-w-[250px] bg-gray-100 rounded-lg p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-700 capitalize">{title}</h3>
        <span className={cn("text-sm font-medium", isOverCapacity ? "text-red-500" : "text-gray-500")}>
          {records.length} / {capacity}
        </span>
      </div>
      <div className="flex-1">
        <SortableContext id={id} items={records.map(r => r.id)} strategy={verticalListSortingStrategy}>
          {records.map(r => (
            <SortableItem key={r.id} id={r.id} record={r} isDragging={r.id === activeId} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export const ConstraintCanvas = () => {
  const { state, dispatch } = useStore();
  const [activeId, setActiveId] = useState(null);
  const [conflictError, setConflictError] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setConflictError(null);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeRecord = state.records.find(r => r.id === active.id);
    const toLane = over.id; // Either lane id or item id

    // Find lane if dropped on an item
    const targetLane = ['backlog', 'in-progress', 'review', 'done'].includes(toLane)
      ? toLane
      : state.records.find(r => r.id === toLane)?.lane;

    if (!targetLane || activeRecord.lane === targetLane) return;

    const laneRecords = state.records.filter(r => r.lane === targetLane);

    // Check constraint
    if (laneRecords.length >= LANE_CAPACITY[targetLane]) {
      setConflictError(`Cannot move "${activeRecord.name}" to ${targetLane}. Lane is at capacity.`);
      return;
    }

    dispatch({ type: 'MOVE_LANE', payload: { id: active.id, lane: targetLane } });
  };

  return (
    <div className="flex flex-col h-full">
      {conflictError && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm font-medium">
          {conflictError}
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
          {['backlog', 'in-progress', 'review', 'done'].map(laneId => (
            <Lane
              key={laneId}
              id={laneId}
              title={laneId.replace('-', ' ')}
              records={state.records.filter(r => r.lane === laneId && r.status !== 'archived')}
              activeId={activeId}
            />
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
            <SortableItem
               id={activeId}
               record={state.records.find(r => r.id === activeId)}
               isDragging={false}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
