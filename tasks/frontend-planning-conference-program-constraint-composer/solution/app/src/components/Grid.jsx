import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useStore } from '../store.js';
import { selectConflicts } from '../selectors.js';

const HOURS = Array.from({ length: 11 }).map((_, i) => i + 8); // 8 to 18

const SessionBlock = ({ session, placement, conflicts }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: placement ? `placed-${placement.id}` : `unplaced-${session.id}`,
    data: { session, placement }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const isConflict = conflicts.some(c => c.p1?.id === placement?.id || c.p2?.id === placement?.id);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        height: `${(session.duration / 5) * 4}px`, // 4px per 5 mins
      }}
      {...listeners}
      {...attributes}
      className={`absolute w-full p-1 text-xs border rounded cursor-move shadow-sm ${
        isConflict ? 'bg-red-100 border-red-500 text-red-900 z-10' : 'bg-blue-50 border-blue-300 text-blue-900'
      }`}
    >
      <div className="font-bold truncate">{session.title}</div>
      {isConflict && <div className="text-[10px] leading-tight">Conflict</div>}
    </div>
  );
};

const GridSlot = ({ roomId, time, day, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${day}-${roomId}-${time}`,
    data: { roomId, time, day }
  });

  return (
    <div ref={setNodeRef} className={`h-[4px] border-b border-gray-100 ${isOver ? 'bg-blue-100' : ''}`}>
      {children}
    </div>
  );
};

export const Grid = ({ day }) => {
  const rooms = useStore(state => state.rooms);
  const placements = useStore(state => state.placements.filter(p => p.day === day));
  const sessions = useStore(state => state.sessions);
  const state = useStore();
  const conflicts = selectConflicts(state);

  return (
    <div className="flex-1 overflow-auto border-t bg-white relative">
      <div className="flex">
        <div className="w-16 flex-shrink-0 border-r bg-gray-50 sticky left-0 z-20">
          <div className="h-10 border-b"></div>
          {HOURS.map(h => (
            <div key={h} className="h-[48px] text-xs text-right pr-2 pt-1 text-gray-500 border-b">
              {h.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {rooms.map(room => (
          <div key={room.id} className="flex-1 min-w-[150px] border-r relative">
            <div className="h-10 border-b bg-gray-50 flex items-center justify-center font-semibold text-sm sticky top-0 z-10">
              {room.name}
            </div>
            <div className="relative">
              {HOURS.map((h) =>
                Array.from({ length: 12 }).map((_, m) => (
                  <GridSlot key={`${h}-${m}`} roomId={room.id} day={day} time={`${h.toString().padStart(2, '0')}:${(m * 5).toString().padStart(2, '0')}`} />
                ))
              )}
              {placements.filter(p => p.roomId === room.id).map(p => {
                const session = sessions.find(s => s.id === p.sessionId);
                if (!session) return null;
                const [ph, pm] = p.startTime.split(':').map(Number);
                const offsetMins = (ph - 8) * 60 + pm;
                const top = (offsetMins / 5) * 4;
                return (
                  <div key={p.id} className="absolute w-full px-1 z-10" style={{ top: `${top}px` }}>
                    <SessionBlock session={session} placement={p} conflicts={conflicts} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
