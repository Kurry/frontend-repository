import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store';
import { CostumeRecord, Status } from '../schema';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function StatusBadge({ status }: { status: Status }) {
  const colors: Record<Status, string> = {
    empty: 'bg-surface-hover text-text-muted',
    draft: 'bg-blue-500/20 text-blue-400',
    ready: 'bg-primary/20 text-primary',
    changed: 'bg-warning/20 text-warning',
    archived: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
      {status}
    </span>
  );
}

function SortableItem({ record, active, onSelect }: { record: CostumeRecord, active: boolean, onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: record.id });
  const deleteRecord = useStore(state => state.deleteRecord);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const isScenario = !!record.branchParentId;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center p-3 rounded-md border border-transparent transition-colors mb-2 outline-none
        ${active ? 'bg-surface-hover/80 border-surface-hover' : 'hover:bg-surface-hover/50'}
        ${isDragging ? 'shadow-xl opacity-80 bg-surface border-border' : ''}
        ${isScenario ? 'ml-8 border-l-4 border-l-primary' : ''}
      `}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
    >
      <div
        {...attributes}
        {...listeners}
        className="text-text-muted opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 cursor-grab active:cursor-grabbing"
        aria-label={`Reorder ${record.title}`}
        role="button"
        tabIndex={0}
      >
        <GripVertical size={16} />
      </div>

      <div className="flex-1 flex items-center gap-4 ml-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isScenario ? 'text-primary' : 'text-white'}`}>
            {record.title}
          </p>
          <div className="text-xs text-text-muted flex gap-2 truncate mt-1">
            <span>{record.character}</span>
            <span>•</span>
            <span>Scene {record.scene}</span>
          </div>
        </div>

        <div className="w-24 shrink-0 flex justify-end">
           <StatusBadge status={record.status} />
        </div>
      </div>
    </div>
  );
}

export function CostumeList({ selectedId, onSelect }: { selectedId: string | null, onSelect: (id: string) => void }) {
  const records = useStore(state => state.records);
  const reorderRecords = useStore(state => state.reorderRecords);
  const addRecord = useStore(state => state.addRecord);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderRecords(active.id as string, over.id as string);
    }
  };

  const handleAdd = () => {
    addRecord({
      title: 'New Look',
      character: 'Unknown',
      scene: 1,
      status: 'empty',
      scenarioState: 'idle'
    });
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-surface/30 rounded-lg border border-dashed border-border">
        <p className="text-text-muted mb-4">No costume looks found in the collection.</p>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-semibold rounded-full hover:bg-primary-hover transition-colors"
        >
          <Plus size={18} />
          Create First Look
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">Collection ({records.length})</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-surface-hover text-white hover:bg-white hover:text-black font-medium rounded-full transition-colors"
        >
          <Plus size={16} />
          Add Look
        </button>
      </div>

      <div className="flex items-center px-5 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 border-b border-border/50">
        <div className="w-8" /> {/* Drag handle spacer */}
        <div className="flex-1">Details</div>
        <div className="w-24 text-right pr-2">Status</div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={records.map(r => r.id)} strategy={verticalListSortingStrategy}>
          <div className="pb-32">
            {records.map((record) => (
              <SortableItem
                key={record.id}
                record={record}
                active={record.id === selectedId}
                onSelect={() => onSelect(record.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
