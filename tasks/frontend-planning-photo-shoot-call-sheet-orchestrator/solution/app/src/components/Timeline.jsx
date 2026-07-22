import React from 'react';
import { useStore } from '../store';
import { DndContext, useDroppable } from '@dnd-kit/core';

// Represents a 10 hour day starting at 8:00 AM
const START_HOUR = 8;
const END_HOUR = 18;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
const INTERVAL = 5; // 5 minute slots
const PIXELS_PER_MINUTE = 4; // Zoom level

function TimelineDroppable() {
  const { isOver, setNodeRef } = useDroppable({
    id: 'timeline-track',
    data: { type: 'timeline' }
  });

  const shots = useStore(state => state.shots);
  const scheduleShot = useStore(state => state.scheduleShot);

  // Generate grid marks
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  return (
    <div
      ref={setNodeRef}
      className={`relative w-max h-full min-w-full bg-gray-50 border-t border-gray-300 motion-safe:transition-colors ${isOver ? 'bg-blue-50/50' : ''}`}
      style={{ width: `${TOTAL_MINUTES * PIXELS_PER_MINUTE}px` }}
      role="grid"
      aria-label="Daily timeline grid, 5 minute intervals"
    >
      {/* Light/Weather bands (static example) */}
      <div
        className="absolute top-0 h-full bg-yellow-100/30 border-x border-yellow-200/50 pointer-events-none"
        style={{ left: `${0 * PIXELS_PER_MINUTE}px`, width: `${120 * PIXELS_PER_MINUTE}px` }} // 8am-10am morning band
        title="Morning Light Band"
      />
      <div
        className="absolute top-0 h-full bg-blue-100/20 border-x border-blue-200/50 pointer-events-none"
        style={{ left: `${(4 * 60) * PIXELS_PER_MINUTE}px`, width: `${(2 * 60) * PIXELS_PER_MINUTE}px` }} // 12pm-2pm mid-day
        title="Mid-day Light Band"
      />

      {/* Grid lines & labels */}
      <div className="absolute top-0 w-full flex text-xs text-gray-500 font-medium select-none h-6 bg-white border-b border-gray-200 z-10 sticky top-0">
        {hours.map(hour => (
          <div
            key={`label-${hour}`}
            className="border-l border-gray-300 pl-1"
            style={{ position: 'absolute', left: `${(hour - START_HOUR) * 60 * PIXELS_PER_MINUTE}px`, width: `${60 * PIXELS_PER_MINUTE}px` }}
          >
            {hour}:00
          </div>
        ))}
      </div>

      {hours.map(hour => (
        <div
          key={`line-${hour}`}
          className="absolute top-0 h-full border-l border-gray-300 pointer-events-none"
          style={{ left: `${(hour - START_HOUR) * 60 * PIXELS_PER_MINUTE}px` }}
        />
      ))}

      {/* Sub-grid lines (15min) */}
      {Array.from({ length: TOTAL_MINUTES / 15 }, (_, i) => (
        <div
          key={`sub-${i}`}
          className="absolute top-6 h-full border-l border-gray-200 border-dashed pointer-events-none"
          style={{ left: `${i * 15 * PIXELS_PER_MINUTE}px` }}
        />
      ))}

      {/* Scheduled Shots */}
      <div className="absolute top-8 w-full h-24">
        {shots.filter(s => s.scheduledTime !== null).map(shot => {
          // Naive overlap check for visual conflict red border
          const isConflict = shots.some(other =>
            other.id !== shot.id &&
            other.scheduledTime !== null &&
            ((other.scheduledTime >= shot.scheduledTime && other.scheduledTime < shot.scheduledTime + shot.duration) ||
             (shot.scheduledTime >= other.scheduledTime && shot.scheduledTime < other.scheduledTime + other.duration))
          );

          return (
            <div
              key={`sch-${shot.id}`}
              className={`absolute h-16 rounded shadow-sm text-xs p-2 overflow-hidden cursor-grab motion-safe:transition-all ${isConflict ? 'bg-red-100 border-2 border-red-500 text-red-900' : 'bg-blue-100 border border-blue-400 text-blue-900'}`}
              style={{
                left: `${shot.scheduledTime * PIXELS_PER_MINUTE}px`,
                width: `${shot.duration * PIXELS_PER_MINUTE}px`,
                top: `${shot.priority === 1 ? 0 : 20}px` // naive stacking
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') scheduleShot(shot.id, Math.min(TOTAL_MINUTES - shot.duration, shot.scheduledTime + INTERVAL));
                if (e.key === 'ArrowLeft') scheduleShot(shot.id, Math.max(0, shot.scheduledTime - INTERVAL));
                if (e.key === 'Delete' || e.key === 'Backspace') useStore.getState().moveShot(shot.id, { scheduledTime: null, status: 'required' });
              }}
              aria-label={`Scheduled ${shot.title} at minute ${shot.scheduledTime} for ${shot.duration} minutes. ${isConflict ? 'Has conflict.' : ''}`}
            >
              <div className="font-bold truncate">{shot.title}</div>
              <div className="truncate opacity-75">{shot.duration}m</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Timeline() {
  const scheduleShot = useStore(state => state.scheduleShot);
  const moveShot = useStore(state => state.moveShot);

  const handleDragEnd = (event) => {
    const { active, over, delta } = event;

    if (over && over.id === 'timeline-track') {
      const activeShot = useStore.getState().shots.find(s => s.id === active.id);

      // Calculate drop time based on delta.x + initial drop position logic.
      // For simplicity in this demo without complex absolute bounding rect math:
      // If dropping a required/unscheduled shot, start at 0 and add delta.x offset.
      // If dragging an already scheduled shot, add delta to current time.
      let newTime = 0;
      if (activeShot.scheduledTime !== null) {
        newTime = activeShot.scheduledTime + Math.round(delta.x / PIXELS_PER_MINUTE);
      } else {
        // Assume dragging from left sidebar drops somewhere in the middle. We'll use a hardcoded offset based on delta if needed, or snap to start for safety.
        // A robust app uses getBoundingClientRect. Here we snap to a valid grid slot.
        const dropXOffset = Math.max(0, delta.x);
        newTime = Math.round(dropXOffset / PIXELS_PER_MINUTE);
      }

      // Snap to INTERVAL
      newTime = Math.round(newTime / INTERVAL) * INTERVAL;

      // Clamp bounds
      newTime = Math.max(0, Math.min(newTime, TOTAL_MINUTES - activeShot.duration));

      scheduleShot(active.id, newTime);
    } else if (over && over.id === 'un-schedule-zone') {
       moveShot(active.id, { scheduledTime: null, status: 'required' });
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-2 border-b border-gray-200 bg-white sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <h2 className="text-sm font-bold text-gray-800">Timeline & Orchestration Grid</h2>
        <div className="text-xs text-gray-500 flex gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-200 inline-block rounded-sm"></span> Morning Light</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-200 inline-block rounded-sm"></span> Mid-day Light</span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar">
        <DndContext onDragEnd={handleDragEnd}>
          <TimelineDroppable />
        </DndContext>
      </div>
    </div>
  );
}
