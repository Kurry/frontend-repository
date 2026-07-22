import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SleepRecord, Action } from '../store';
import { AlertCircle } from 'lucide-react';
import { DroppableLane } from './DroppableLane';

interface SortableItemProps {
  record: SleepRecord;
  hasConflict: boolean;
  onResolve: (id: string) => void;
  onSelect: (id: string) => void;
}

function SortableItem({ record, hasConflict, onResolve, onSelect }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: record.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded border bg-white shadow-sm flex flex-col gap-2 cursor-grab active:cursor-grabbing ${
        hasConflict ? 'border-red-500 bg-red-50/50' : 'border-gray-200'
      }`}
      onClick={() => onSelect(record.id)}
      {...attributes}
      {...listeners}
    >
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Record: {record.id}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
            record.status === 'empty' ? 'bg-gray-100 text-gray-700' :
            record.status === 'draft' ? 'bg-blue-100 text-blue-700' :
            record.status === 'ready' ? 'bg-green-100 text-green-700' :
            record.status === 'changed' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-200 text-gray-500'
        }`}>
          {record.status}
        </span>
      </div>
      <div className="text-xs text-gray-500 flex justify-between">
        <span>Duration: {record.data.durationHours}h</span>
        <span>Quality: {record.data.quality}</span>
      </div>
      {hasConflict && (
        <div className="flex items-center justify-between text-red-600 bg-red-100/50 p-2 rounded text-xs mt-1">
          <div className="flex items-center gap-1">
            <AlertCircle size={14} />
            <span>Conflict Detected</span>
          </div>
          <button
            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:ring-2 focus:ring-red-500 transition-colors pointer-events-auto"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onResolve(record.id);
            }}
          >
            Resolve
          </button>
        </div>
      )}
    </div>
  );
}

interface ConstraintCanvasProps {
  records: SleepRecord[];
  conflictId: string | null;
  dispatch: React.Dispatch<Action>;
  onSelect: (id: string) => void;
}

export function ConstraintCanvas({ records, conflictId, dispatch, onSelect }: ConstraintCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5,
        }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const lanes: Array<'Queue' | 'Baseline' | 'Variance'> = ['Queue', 'Baseline', 'Variance'];

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over) {
       // if we are dropping on a lane
       if (lanes.includes(over.id as any)) {
            dispatch({ type: 'MOVE_RECORD', payload: { id: active.id as string, targetLane: over.id as any } });
       } else {
            // if we are dropping on another item
            const overRecord = records.find(r => r.id === over.id);
            if (overRecord && overRecord.lane !== records.find(r => r.id === active.id)?.lane) {
                 dispatch({ type: 'MOVE_RECORD', payload: { id: active.id as string, targetLane: overRecord.lane } });
            }
       }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {lanes.map((lane) => {
          const laneRecords = records.filter((r) => r.lane === lane);
          return (
            <DroppableLane key={lane} id={lane} title={lane}>
                <SortableContext
                  items={laneRecords.map(r => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                    {laneRecords.map((record) => (
                      <SortableItem
                        key={record.id}
                        record={record}
                        hasConflict={record.id === conflictId}
                        onResolve={(id) => dispatch({ type: 'RESOLVE_CONFLICT', payload: { id } })}
                        onSelect={onSelect}
                      />
                    ))}
                </SortableContext>
            </DroppableLane>
          );
        })}
      </div>
    </DndContext>
  );
}
