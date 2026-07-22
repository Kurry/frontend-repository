import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { blockStatuses } from '../utils/schema';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

function DroppableLane({ status, children }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `lane-${status}`,
    data: { status }
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[200px] p-4 m-2 rounded-lg border-2 lane-${status} ${
        isOver ? 'ring-4 ring-primary ring-opacity-50' : ''
      }`}
    >
      <h3 className="font-bold text-lg capitalize mb-4 text-center">{status}</h3>
      <div className="flex flex-col gap-2 min-h-[300px]">
        {children}
      </div>
    </div>
  );
}

function DraggableBlock({ record }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: record.id,
    data: record
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const store = useStore();
  const isSelected = store.selectedRecordId === record.id;

  return (
    <motion.div
      layout
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => store.setSelectedRecord(record.id)}
      className={`p-3 bg-white rounded shadow border-2 cursor-grab active:cursor-grabbing ${
        isSelected ? 'border-primary ring-2 ring-primary/50' : 'border-transparent'
      } ${record.conflict ? 'border-red-500' : ''}`}
    >
      <div className="font-medium text-sm truncate">{record.blockName}</div>
      <div className="text-xs text-gray-500">Size: {record.size}</div>
      {record.conflict && <div className="text-xs text-red-500 mt-1 font-bold">Conflict!</div>}
    </motion.div>
  );
}

export function ConstraintCanvas() {
  const { records, updateRecord, activeFilter, selectedRecordId } = useStore();
  const [activeRecord, setActiveRecord] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const visibleRecords = activeFilter
    ? records.filter((r) => r.status === activeFilter)
    : records;

  const handleDragStart = (event) => {
    setActiveRecord(event.active.data.current);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveRecord(null);

    if (over && over.data.current?.status) {
      const newStatus = over.data.current.status;
      const recordId = active.id;

      const record = records.find(r => r.id === recordId);
      if (record && record.status !== newStatus) {
        // Resolve conflict if dropped into resolved
        let conflict = record.conflict;
        if (newStatus === 'resolved' && conflict) {
          conflict = false;
        } else if (newStatus === 'conflict') {
          conflict = true;
        }

        updateRecord(recordId, { status: newStatus, conflict });
      }
    }
  };

  return (
    <div className="w-full h-full p-4 overflow-x-auto bg-gray-50 rounded-xl shadow-inner">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-row h-full">
          {blockStatuses.map((status) => (
            <DroppableLane key={status} status={status}>
              {visibleRecords
                .filter((r) => r.status === status)
                .map((record) => (
                  <DraggableBlock key={record.id} record={record} />
                ))}
            </DroppableLane>
          ))}
        </div>

        <DragOverlay>
          {activeRecord ? (
            <div className="p-3 bg-white rounded shadow-lg border-2 border-primary opacity-90 scale-105 cursor-grabbing">
              <div className="font-medium text-sm truncate">{activeRecord.blockName}</div>
              <div className="text-xs text-gray-500">Size: {activeRecord.size}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
