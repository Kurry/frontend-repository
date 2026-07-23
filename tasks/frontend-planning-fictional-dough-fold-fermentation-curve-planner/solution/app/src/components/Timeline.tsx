import { useEffect } from 'react';
import { useRef } from 'react';
import { usePlanStore } from '../store';
import { differenceInMinutes, parseISO } from 'date-fns';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const DraggableEvent = ({ event, isSelected, onClick }: any) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
  });

  const evStart = parseISO(event.start);
  const windowStart = parseISO('2026-10-17T08:00:00Z');
  const leftPos = (differenceInMinutes(evStart, windowStart) / 300) * 100;

  const style = {
    left: `${leftPos}%`,
    top: event.type === 'fold' ? '0px' : '40px',
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`absolute p-2 border rounded cursor-grab shadow-sm w-24 active:cursor-grabbing
        ${isSelected ? 'bg-blue-100 border-blue-500 z-10' : 'bg-white z-0'}
      `}
      style={style}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
          e.preventDefault();
        }
        if (e.key === 'm' || e.key === 'M') {
          const time = prompt('Move event to (e.g. 2026-10-17T09:35:00Z):', event.start);
          if (time) {
            // Trigger global move if prompt works
            const eventTarget = new CustomEvent('custom-move-event', { detail: { id: event.id, time }});
            window.dispatchEvent(eventTarget);
          }
        }
      }}
    >
      <div className="text-xs font-bold">{event.id}</div>
      <div className="text-xs truncate">{event.label}</div>
      <div className="text-xs text-gray-500">{event.start.substring(11, 16)}</div>
    </div>
  );
};

export const Timeline = () => {
  const { events, selectedEventId, selectEvent, moveEvent, activityBands } = usePlanStore();
  const timelineRef = useRef<HTMLDivElement>(null);

  // Listen for the prompt move
  useEffect(() => {
    const handleCustomMove = (e: any) => {
      moveEvent(e.detail.id, e.detail.time);
    };
    window.addEventListener('custom-move-event', handleCustomMove as any);
    return () => window.removeEventListener('custom-move-event', handleCustomMove as any);
  }, [moveEvent]);

  return (
    <div className="h-64 border-b border-gray-300 p-4 relative overflow-x-auto" ref={timelineRef}>
      <h2 className="mb-2 font-bold">Timeline</h2>

      {/* Activity Bands Background */}
      <div className="absolute top-12 left-4 right-4 h-32 opacity-20 pointer-events-none" style={{ width: '800px' }}>
         {activityBands.map(b => {
             const bStart = parseISO(`2026-10-17T${b.start}:00Z`);
             const bEnd = parseISO(`2026-10-17T${b.end}:00Z`);
             const windowStart = parseISO('2026-10-17T08:00:00Z');
             const leftPos = (differenceInMinutes(bStart, windowStart) / 300) * 100;
             const width = (differenceInMinutes(bEnd, bStart) / 300) * 100;
             return (
               <div
                 key={b.id}
                 className={`absolute h-full border-r ${b.creditsPerMinute === 2 ? 'bg-orange-300' : 'bg-gray-300'}`}
                 style={{ left: `${leftPos}%`, width: `${width}%` }}
               />
             );
         })}
      </div>

      {/* Time axis */}
      <div className="flex border-b border-gray-400 pb-2 mb-4 relative" style={{ width: '800px' }}>
        {[...Array(13)].map((_, i) => {
          const hour = Math.floor((i * 25) / 60) + 8;

          return (
            <div key={i} className="flex-1 text-xs text-gray-500 border-l border-gray-400 pl-1 h-4">
              {i === 0 ? '08:00' : (i * 25) % 60 === 0 ? `${hour.toString().padStart(2, '0')}:00` : ''}
            </div>
          );
        })}
      </div>

      <div className="relative h-32" style={{ width: '800px' }}>
        {events.map((ev) => (
           <DraggableEvent
             key={ev.id}
             event={ev}
             isSelected={selectedEventId === ev.id}
             onClick={() => selectEvent(ev.id)}
           />
        ))}
      </div>
    </div>
  );
};
