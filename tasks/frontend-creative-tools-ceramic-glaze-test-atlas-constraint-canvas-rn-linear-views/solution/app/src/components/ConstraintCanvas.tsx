import { useStore } from '../store';
import type { ConstraintLane } from '../types';
import { DndContext, closestCorners } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';

const LANES: { id: ConstraintLane, title: string, color: string }[] = [
  { id: 'unassigned', title: 'Unassigned', color: 'bg-stone-50' },
  { id: 'temperature', title: 'Temperature', color: 'bg-orange-50' },
  { id: 'application', title: 'Application', color: 'bg-blue-50' },
  { id: 'thickness', title: 'Thickness', color: 'bg-purple-50' },
  { id: 'firing', title: 'Firing', color: 'bg-red-50' }
];

const DraggableRecord = ({ record }: { record: any }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: record.id,
    data: record,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 mb-2 bg-white rounded border shadow-sm cursor-grab active:cursor-grabbing hover:border-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500
        ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : 'border-stone-200'}
        ${record.status === 'conflict' ? 'border-red-400 bg-red-50' : ''}
      `}
      role="listitem"
    >
      <div className="font-medium text-sm text-stone-800">{record.name}</div>
      <div className="text-xs text-stone-500 truncate">{record.baseGlaze}</div>
      <div className="mt-1 flex gap-1">
        <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize font-medium
            ${record.status === 'conflict' ? 'bg-red-200 text-red-800' : 'bg-stone-100 text-stone-600'}
        `}>
          {record.status}
        </span>
      </div>
    </div>
  );
};

const Lane = ({ lane }: { lane: typeof LANES[0] }) => {
  const { records } = useStore();
  const { setNodeRef, isOver } = useDroppable({
    id: lane.id,
  });

  const laneRecords = records.filter(r => r.lane === lane.id && r.status !== 'archived');

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[200px] border border-stone-200 rounded-lg flex flex-col overflow-hidden transition-colors
        ${lane.color}
        ${isOver ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''}
      `}
      role="region"
      aria-label={`${lane.title} lane`}
    >
      <div className="p-3 border-b border-stone-200 font-semibold text-stone-700 text-sm flex justify-between items-center bg-white/50">
        {lane.title}
        <span className="text-xs bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full">{laneRecords.length}</span>
      </div>
      <div className="p-2 flex-1 overflow-y-auto" role="list">
        {laneRecords.map(record => (
          <DraggableRecord key={record.id} record={record} />
        ))}
        {laneRecords.length === 0 && (
          <div className="text-center text-xs text-stone-400 italic py-4">Drag here</div>
        )}
      </div>
    </div>
  );
};

export const ConstraintCanvas = () => {
  const { moveRecordLane, selectedRecordId, setSelectedRecordId } = useStore();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const recordId = active.id as string;
    const newLane = over.id as ConstraintLane;
    const record = active.data.current;

    if (!record) return;
    if (record.lane === newLane) return;

    if (newLane !== 'unassigned') {
        if (!selectedRecordId) {
            toast.error("Must select a record before moving it across constraints");
            return;
        }
        if (recordId !== selectedRecordId) {
            setSelectedRecordId(recordId);
        }
        // Conflict resolution simulation logic
        if (record.status === 'conflict') {
            moveRecordLane(recordId, newLane, 'resolved');
            toast.success("Conflict resolved");
        } else {
             // Arbitrary rule for demo: firing lane creates conflict if temp > 1250
            if (newLane === 'firing' && record.temperature && record.temperature > 1250) {
                 moveRecordLane(recordId, newLane, 'conflict');
                 toast.error("Constraint conflict detected!");
            } else {
                moveRecordLane(recordId, newLane, 'changed');
            }
        }
    } else {
        moveRecordLane(recordId, newLane, record.status === 'conflict' ? 'conflict' : 'draft');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-x-auto">
        <div className="mb-4 text-stone-600 text-sm">
            Drag tests across constraint lanes to update their state. Select a record to resolve conflicts.
        </div>
        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-4 min-h-0">
            {LANES.map(lane => (
            <Lane key={lane.id} lane={lane} />
            ))}
        </div>
        </DndContext>
    </div>
  );
};
