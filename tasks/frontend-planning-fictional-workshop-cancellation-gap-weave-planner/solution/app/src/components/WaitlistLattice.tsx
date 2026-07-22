import React from 'react';
import { useStore } from '../store';
import { useDraggable } from '@dnd-kit/core';

const DraggableRequest: React.FC<{ id: string; request: any }> = ({ id, request }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { request }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 border rounded-md shadow-sm mb-2 cursor-grab bg-white z-50 ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : 'hover:border-blue-300'}`}
    >
      <div className="font-bold text-sm text-gray-800">{request.id}</div>
      <div className="text-xs text-gray-500">{request.serviceId} | {request.durationMinutes}m</div>
      <div className="mt-2 flex gap-1 flex-wrap">
        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded uppercase font-semibold">Priority {request.priority}</span>
        {request.status === 'waiting' && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 text-[10px] rounded uppercase font-semibold">Exact Fit</span>}
      </div>
    </div>
  );
};

export const WaitlistLattice: React.FC = () => {
  const { waitlist } = useStore();

  return (
    <div className="w-64 border border-gray-300 bg-gray-50 rounded-md p-4 flex flex-col h-[500px]" aria-label="Waitlist Lattice">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Waitlist Lattice</h2>
      <div className="flex-1 overflow-y-auto pr-1">
        {waitlist.filter(w => w.status === 'waiting').map(request => (
          <DraggableRequest key={request.id} id={request.id} request={request} />
        ))}
      </div>
    </div>
  );
};
