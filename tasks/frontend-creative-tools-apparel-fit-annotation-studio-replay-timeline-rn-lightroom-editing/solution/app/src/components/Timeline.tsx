import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo, History, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { type TimelineEvent } from '../schema';

const Timeline: React.FC = () => {
  const { selectedId, records, getRecordHistory, scrubTimeline, restoreCheckpoint, undoLastMutation } = useStore();
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  // Track previous state for causal motion
  const prevRecordRef = useRef(selectedId ? records[selectedId] : null);

  useEffect(() => {
    if (selectedId && records[selectedId]) {
      prevRecordRef.current = records[selectedId];
    }
  }, [selectedId, records]);

  if (!selectedId) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 flex flex-col items-center justify-center text-center shrink-0 min-h-[160px]">
        <History size={24} className="text-neutral-300 mb-2" />
        <p className="text-sm text-neutral-500">Timeline unavailable</p>
      </div>
    );
  }

  const record = records[selectedId];
  if (!record) return null; // Edge case where record is deleted

  const history = getRecordHistory(selectedId);
  const currentEventIndex = history.findIndex(e =>
    JSON.stringify(e.state) === JSON.stringify(record)
  );

  const isScrubbing = currentEventIndex !== history.length - 1;

  const handleScrub = (eventId: string) => {
    scrubTimeline(selectedId, eventId);
  };

  const handleRestore = (eventId: string) => {
    if (window.confirm("Restore this checkpoint? Future history for this record will be lost.")) {
      restoreCheckpoint(selectedId, eventId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col shrink-0 min-h-[160px]">
      <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
        <h3 className="font-medium text-neutral-800 flex items-center gap-2 text-sm">
          <History size={16} /> Replay Timeline
        </h3>
        <button
          onClick={undoLastMutation}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-300 rounded hover:bg-neutral-50 transition-colors"
          title="Undo last action globally"
        >
          <Undo size={14} /> Undo
        </button>
      </div>

      <div className="p-6 overflow-x-auto relative min-h-[120px] flex items-center">
        {history.length === 0 ? (
          <p className="text-sm text-neutral-500 italic w-full text-center">No history recorded yet.</p>
        ) : (
          <div className="flex items-center min-w-max relative px-4 w-full justify-between">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-neutral-200 -translate-y-1/2 -z-10" />

            {history.map((event: TimelineEvent, idx) => {
              const isCurrent = JSON.stringify(event.state) === JSON.stringify(record);
              const isPast = idx < (currentEventIndex === -1 ? history.length : currentEventIndex);


              const date = new Date(event.timestamp);
              const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div
                  key={event.eventId}
                  className="relative flex flex-col items-center group cursor-pointer px-4"
                  onClick={() => handleScrub(event.eventId)}
                  onMouseEnter={() => setHoveredEventId(event.eventId)}
                  onMouseLeave={() => setHoveredEventId(null)}
                >
                  <motion.div
                    layoutId={`timeline-node-${event.eventId}`}
                    className={clsx(
                      "w-4 h-4 rounded-full border-2 bg-white z-10 transition-colors duration-200",
                      isCurrent ? "border-blue-500 scale-125 ring-4 ring-blue-500/20" :
                      isPast ? "border-neutral-800 bg-neutral-800" :
                      "border-neutral-300"
                    )}
                  />

                  {/* Tooltip / Label */}
                  <div className={clsx(
                    "absolute -top-10 flex flex-col items-center whitespace-nowrap transition-opacity",
                    hoveredEventId === event.eventId || isCurrent ? "opacity-100" : "opacity-0"
                  )}>
                    <span className="text-[10px] font-medium text-neutral-500 flex items-center gap-1">
                      <Clock size={10} /> {timeString}
                    </span>
                    <span className="text-xs font-semibold text-neutral-700">
                      {idx === 0 ? 'Created' : `Edit ${idx}`}
                    </span>
                  </div>

                  <AnimatePresence>
                    {isCurrent && isScrubbing && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(event.eventId);
                        }}
                        className="absolute -bottom-10 px-2 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded whitespace-nowrap shadow-sm hover:bg-blue-700"
                      >
                        Restore
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* State Preview during scrub */}
      {isScrubbing && (
        <div className="bg-amber-50 border-t border-amber-200 p-3 flex justify-between items-center text-sm">
          <span className="text-amber-800 font-medium">Previewing past state</span>
          <button
            onClick={() => handleScrub(history[history.length - 1].eventId)}
            className="text-amber-700 hover:text-amber-900 underline"
          >
            Return to present
          </button>
        </div>
      )}
    </div>
  );
};

export default Timeline;
