import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AirQualityRecord, AirQualityStatusType } from '../types';
import { useAppContext } from '../store';
import { RecordForm } from './RecordForm';
import { Pencil, Trash2, X } from 'lucide-react';

const statuses: AirQualityStatusType[] = ['Draft', 'Ready', 'Changed', 'Archived'];

const SortableItem = ({ id, record, onEdit, onDelete }: { id: string; record: AirQualityRecord; onEdit: (r: AirQualityRecord) => void; onDelete: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 mb-2 bg-white rounded shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing ${isDragging ? 'z-50 ring-2 ring-blue-400' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-800">{record.room}</h3>
        <div className="flex gap-1">
          <button
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking buttons
            onClick={() => onEdit(record)}
            className="p-1 text-gray-400 hover:text-blue-600 rounded cursor-pointer relative z-10 pointer-events-auto"
            aria-label="Edit record"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(record.id)}
            className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer relative z-10 pointer-events-auto"
            aria-label="Delete record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">AQI: <strong className={record.reading > 100 ? 'text-red-500' : 'text-green-600'}>{record.reading}</strong></span>
        <span className="text-xs text-gray-400">{new Date(record.timestamp).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export const ConstraintCanvas = () => {
  const { state, dispatch } = useAppContext();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<AirQualityRecord | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const getRecord = (id: string) => state.records.find((r) => r.id === id);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setConflictError(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const recordId = active.id as string;
    const overId = over.id as string;

    const record = getRecord(recordId);
    if (!record) return;

    let targetStatus: AirQualityStatusType | null = null;

    if (statuses.includes(overId as AirQualityStatusType)) {
      targetStatus = overId as AirQualityStatusType;
    } else {
      const overRecord = getRecord(overId);
      if (overRecord) {
        targetStatus = overRecord.status;
      }
    }

    if (targetStatus && targetStatus !== record.status) {
      if (record.status === 'Draft' && targetStatus === 'Archived') {
        setConflictError("Cannot archive a Draft directly. Move to Ready or Changed first.");
        return;
      }

      dispatch({
        type: 'UPDATE_RECORD_STATUS',
        payload: { id: record.id, status: targetStatus },
      });
    }
  };

  const openNewRecord = () => {
    setEditingRecord(undefined);
    setIsFormOpen(true);
  };

  const openEditRecord = (record: AirQualityRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      dispatch({ type: 'DELETE_RECORD', payload: { id } });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Constraint Canvas</h2>
        <button
          onClick={openNewRecord}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
        >
          Add Record
        </button>
      </div>

      {conflictError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded flex justify-between items-center">
          <span>{conflictError}</span>
          <button onClick={() => setConflictError(null)}><X className="w-4 h-4"/></button>
        </div>
      )}

      <div className="flex-1 overflow-x-hidden md:overflow-x-auto overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col md:flex-row gap-4 h-full pb-4">
            {statuses.map((status) => {
              const laneRecords = state.records.filter((r) => r.status === status);
              return (
                <div
                  key={status}
                  className="w-full md:w-72 md:min-w-72 bg-gray-100 rounded-lg flex flex-col shrink-0"
                >
                  <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-200/50 rounded-t-lg">
                    <h3 className="font-semibold text-gray-700">{status}</h3>
                    <span className="bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded-full">
                      {laneRecords.length}
                    </span>
                  </div>

                  <div className="flex-1 p-2">
                    <SortableContext
                      id={status}
                      items={laneRecords.map((r) => r.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="min-h-[100px] h-full" role="listbox" aria-label={`${status} lane`}>
                        {laneRecords.map((record) => (
                          <SortableItem key={record.id} id={record.id} record={record} onEdit={openEditRecord} onDelete={handleDelete} />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="p-3 bg-white rounded shadow-lg border-2 border-blue-400 rotate-2 opacity-90 cursor-grabbing">
                <div className="font-medium">{getRecord(activeId)?.room}</div>
                <div className="text-sm text-gray-500">AQI: {getRecord(activeId)?.reading}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {isFormOpen && (
        <RecordForm onClose={() => setIsFormOpen(false)} record={editingRecord} />
      )}
    </div>
  );
};
