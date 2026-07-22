import React, { useMemo } from 'react';
import { useStore } from '../store';
import { STATUS_LANES, ScenarioStatus } from '../types';
import { DndContext, DragOverlay, closestCorners, PointerSensor, KeyboardSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableCard } from './SortableCard';
import { ScenarioCard } from './ScenarioCard';
import { Lane } from './Lane';

export const ConstraintCanvas: React.FC = () => {
  const { records, moveRecord, reorderRecord, setSelectedRecordId } = useStore();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const activeRecord = useMemo(() => records.find((r) => r.id === activeId), [records, activeId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setSelectedRecordId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over) {
      const activeCard = records.find(r => r.id === active.id);
      const overId = over.id as string;

      const isLaneDrop = STATUS_LANES.includes(overId as ScenarioStatus);
      const overLane = isLaneDrop ? overId as ScenarioStatus : records.find(r => r.id === overId)?.status;

      if (activeCard && overLane) {
        if (!isLaneDrop && active.id !== over.id) {
           reorderRecord(active.id as string, overId, overLane);
        } else if (activeCard.status !== overLane) {
           moveRecord(active.id as string, overLane);
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full w-full gap-4 overflow-x-auto p-4 items-start">
        {STATUS_LANES.map((status) => {
          const laneRecords = records.filter((r) => r.status === status && !r.archived);
          return (
            <Lane key={status} status={status} records={laneRecords}>
              <SortableContext items={laneRecords.map(r => r.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2 min-h-[200px]">
                  {laneRecords.map((record) => (
                    <SortableCard key={record.id} record={record} />
                  ))}
                </div>
              </SortableContext>
            </Lane>
          );
        })}
      </div>
      <DragOverlay>
        {activeRecord ? <ScenarioCard record={activeRecord} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};
