import React, { useState } from 'react';
import { useStore } from '../store';
import { DomainState, RestockTask } from '../types';
import { TaskCard } from './TaskCard';

const LANES: { id: DomainState; title: string }[] = [
  { id: 'empty', title: 'Empty' },
  { id: 'draft', title: 'Draft' },
  { id: 'ready', title: 'Ready' },
  { id: 'changed', title: 'Changed' },
  { id: 'archived', title: 'Archived' },
];

export function TaskBoard() {
  const { records, selectedRecordId, selectRecord, moveRecord, updateRecord } = useStore();
  const [conflictError, setConflictError] = useState<{ id: string; message: string } | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, targetStatus: DomainState) => {
    e.preventDefault();
    const recordId = e.dataTransfer.getData('text/plain');
    const record = records.find((r) => r.id === recordId);

    if (!record || record.status === targetStatus) return;

    // Domain Rule: Cannot move to ready if quantity <= 0 (though base model ensures > 0, let's enforce a strict > 0 rule)
    if (targetStatus === 'ready' && record.quantity <= 0) {
      setConflictError({
        id: record.id,
        message: 'Conflict: Quantity must be > 0 to mark as Ready. Please edit the task.',
      });
      return;
    }

    setConflictError(null);
    moveRecord(recordId, targetStatus);
  };

  // Keyboard shortcut equivalent for moving tasks
  const handleKeyDown = (e: React.KeyboardEvent, laneId: DomainState) => {
    if (e.key === 'v' && selectedRecordId) {
       handleDrop({
         preventDefault: () => {},
         dataTransfer: { getData: () => selectedRecordId }
       } as unknown as React.DragEvent, laneId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4">
      {conflictError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded flex justify-between items-center">
          <span>{conflictError.message}</span>
          <button
            onClick={() => {
              if (conflictError) {
                 updateRecord(conflictError.id, { quantity: 1 });
                 setConflictError(null);
              }
            }}
            className="px-3 py-1 bg-white border border-red-200 rounded text-sm hover:bg-red-50"
          >
            Fix Quantity (Set to 1)
          </button>
        </div>
      )}
      <div className="flex gap-4 flex-1 overflow-x-auto pb-4 no-scrollbar">
        {LANES.map((lane) => {
          const laneRecords = records.filter((r) => r.status === lane.id);
          return (
            <div
              key={lane.id}
              className="flex-shrink-0 w-72 bg-gray-100 rounded-lg flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, lane.id)}
              onKeyDown={(e) => handleKeyDown(e, lane.id)}
              tabIndex={0}
              role="region"
              aria-label={`${lane.title} lane`}
            >
              <div className="p-3 font-semibold text-gray-700 flex justify-between items-center border-b border-gray-200 mb-2">
                <h3>{lane.title}</h3>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{laneRecords.length}</span>
              </div>
              <div className="flex-1 p-2 overflow-y-auto">
                {laneRecords.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isSelected={selectedRecordId === task.id}
                    onClick={() => selectRecord(task.id)}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
