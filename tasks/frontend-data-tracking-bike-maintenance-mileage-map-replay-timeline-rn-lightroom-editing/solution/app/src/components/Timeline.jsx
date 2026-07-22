import React from 'react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { Clock, History, Save, CornerDownLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export function Timeline({ recordId }) {
  const records = useStore(state => state.records);
  const scrubTimeline = useStore(state => state.scrubTimeline);

  const record = records.find(r => r.id === recordId);

  if (!record) return null;

  const handleScrub = (checkpointIndex) => {
    scrubTimeline(recordId, checkpointIndex);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 flex items-center gap-2">
        <History size={18} className="text-slate-600" />
        <h3 className="font-semibold text-slate-800 text-sm">Replay Timeline</h3>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="relative">
          {/* Vertical line connecting events */}
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200"></div>

          <div className="space-y-6 relative">
            {record.timeline.map((event, index) => {
              // Determine if this is the "current" state based on latest scrubbing
              // A simple heuristic: if it's the last event, it's active.
              const isLast = index === record.timeline.length - 1;
              const isScrubTarget = event.description.startsWith('Restored');

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={event.id}
                  className="flex gap-4 relative group"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 z-10
                    ${isLast ? 'bg-blue-500 border-blue-500 text-white shadow-md' : 'bg-white border-slate-300 text-slate-400 group-hover:border-blue-300'}`}
                  >
                    {isLast ? <Save size={14} /> : <Clock size={14} />}
                  </div>

                  <div className={`flex-1 bg-white border rounded-lg p-4 transition-all
                    ${isLast ? 'border-blue-200 shadow-sm ring-1 ring-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">
                          {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                        </div>
                        <div className="font-medium text-slate-800 text-sm">{event.description}</div>
                      </div>

                      {!isLast && (
                        <button
                          onClick={() => handleScrub(event.checkpointIndex)}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded transition-colors"
                          aria-label={`Restore to ${event.description}`}
                          data-testid="scrub-btn"
                        >
                          <CornerDownLeft size={12} />
                          Restore
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-50 rounded p-3 text-xs text-slate-600 grid grid-cols-2 gap-2 border border-slate-100">
                      <div><span className="text-slate-400">Status:</span> <span className="font-medium capitalize">{event.recordState.status}</span></div>
                      <div><span className="text-slate-400">Mileage:</span> <span className="font-medium">{event.recordState.mileage}</span></div>
                      <div className="col-span-2 truncate" title={event.recordState.notes}>
                        <span className="text-slate-400">Notes:</span> {event.recordState.notes || '-'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
