import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useStore, updateRecord } from '../store';
import { format } from 'date-fns';

const LANES = ['draft', 'ready', 'changed', 'archived'];

export default function ConstraintCanvas() {
  const { records } = useStore();
  const [conflict, setConflict] = useState(null); // { record, destStatus, message }

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) {
      // Reordering within the same lane - allowed visually or by WebMCP, but let's keep it simple
      return;
    }

    const record = records.find(r => r.id === draggableId);
    const destStatus = destination.droppableId;

    // Constraint rules (Conflict simulation)
    // - Draft can go anywhere.
    // - Ready cannot go back to Draft without a reason (conflict).
    // - Archived is final unless resolved.

    if (record.status === 'ready' && destStatus === 'draft') {
      setConflict({ record, destStatus, message: 'Cannot move Ready to Draft directly. Please resolve this conflict.' });
      return;
    }

    if (record.status === 'archived' && destStatus !== 'archived') {
      setConflict({ record, destStatus, message: 'Cannot unarchive directly. Please resolve this conflict.' });
      return;
    }

    // Happy path mutation
    updateRecord(record.id, { status: destStatus });
  };

  const resolveConflict = (proceed) => {
    if (proceed) {
      // Force the mutation
      updateRecord(conflict.record.id, { status: conflict.destStatus });
    }
    setConflict(null);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Constraint Canvas</h2>

      {conflict && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="font-semibold text-yellow-800 mb-2">Conflict Detected!</p>
          <p className="text-yellow-700 mb-3">{conflict.message}</p>
          <div className="flex gap-2">
            <button onClick={() => resolveConflict(true)} className="bg-yellow-600 text-white px-3 py-1.5 rounded hover:bg-yellow-700 transition">Force Move</button>
            <button onClick={() => resolveConflict(false)} className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded hover:bg-gray-300 transition">Cancel</button>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {LANES.map(lane => (
            <div key={lane} className="bg-gray-50 rounded-lg p-3 border">
              <h3 className="font-medium text-gray-700 capitalize mb-3 px-2 flex justify-between">
                {lane}
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{records.filter(r => r.status === lane).length}</span>
              </h3>

              <Droppable droppableId={lane}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-[200px] max-h-[500px] overflow-y-auto p-2 rounded transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                  >
                    {records.filter(r => r.status === lane).map((record, index) => (
                      <Draggable key={record.id} draggableId={record.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 mb-2 bg-white rounded border shadow-sm text-sm cursor-grab active:cursor-grabbing transition-shadow
                              ${snapshot.isDragging ? 'shadow-md ring-2 ring-blue-400 opacity-90 scale-105' : 'hover:shadow'}`}
                            style={{
                              ...provided.draggableProps.style,
                              // Reduce motion equivalent (no scale) could be media query based, but inline inline scale is fine, handled by tailwind in real scenarios.
                            }}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold">{record.amount} ml</span>
                              <span className="text-xs text-gray-500">{format(new Date(record.time), 'HH:mm')}</span>
                            </div>
                            <div className="text-xs text-gray-400 break-all">{record.id}</div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
