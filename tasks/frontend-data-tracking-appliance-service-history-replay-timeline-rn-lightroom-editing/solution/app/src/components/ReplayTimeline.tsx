import React, { useState } from 'react';
import { useStore } from '../store';
import { History, Play, CheckCircle2, AlertCircle, Clock, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils';

export default function ReplayTimeline() {
  const { records, derived, scrubTimeline } = useStore();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const activeRecord = records.find(r => r.id === derived.activeSelectionId);

  if (!activeRecord) {
    return null;
  }

  const { service_history, timeline_checkpoint } = activeRecord;
  const currentCheckpointIndex = timeline_checkpoint
    ? service_history.findIndex(cp => cp.id === timeline_checkpoint)
    : service_history.length - 1;

  const handleScrub = (checkpointId: string) => {
    scrubTimeline(activeRecord.id, checkpointId);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'creation': return <Play className="w-4 h-4 text-emerald-500" />;
      case 'service': return <Wrench className="w-4 h-4 text-blue-500" />;
      case 'inspection': return <CheckCircle2 className="w-4 h-4 text-purple-500" />;
      case 'modification': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <History className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Replay Timeline</h3>
      </div>

      {service_history.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <p>No service history available.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 pb-4">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-slate-200" />

            <div className="flex flex-col gap-6 relative z-10">
              {service_history.map((event, index) => {
                const isPast = index <= currentCheckpointIndex;
                const isCurrent = index === currentCheckpointIndex;

                return (
                  <motion.div
                    key={event.id}
                    layout
                    className="flex gap-4 group cursor-pointer"
                    onMouseEnter={() => setHoveredNode(event.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => handleScrub(event.id)}
                  >
                    <div className="flex flex-col items-center shrink-0">
                      <motion.div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 relative z-10 bg-white",
                          isCurrent
                            ? "border-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                            : isPast
                              ? "border-slate-400 hover:border-indigo-400"
                              : "border-slate-200 border-dashed text-slate-300"
                        )}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {getEventIcon(event.type)}
                      </motion.div>
                    </div>

                    <div className={cn(
                      "flex-1 p-3 rounded-lg border transition-all duration-300",
                      isCurrent
                        ? "bg-indigo-50/50 border-indigo-200 shadow-sm"
                        : "bg-white border-slate-200 hover:border-indigo-300",
                      !isPast && !isCurrent && "opacity-50 bg-slate-50/50 border-dashed"
                    )}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-slate-800 text-sm">{event.description}</span>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(event.timestamp).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 capitalize mb-2">
                        {event.type} Event
                      </div>

                      <AnimatePresence>
                        {(isCurrent || hoveredNode === event.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 mt-2 border-t border-slate-200/60">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-slate-400 block">Status</span>
                                  <span className="font-medium text-slate-700">{event.snapshot.status}</span>
                                </div>
                                {event.snapshot.metadata && Object.keys(event.snapshot.metadata).length > 0 && (
                                  <div>
                                    <span className="text-slate-400 block">Changes</span>
                                    <span className="font-medium text-slate-700">Updated details</span>
                                  </div>
                                )}
                              </div>
                              {isCurrent ? (
                                <div className="mt-2 text-xs font-medium text-indigo-600 flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                  Current Checkpoint
                                </div>
                              ) : (
                                <div className="mt-2 text-xs font-medium text-slate-500">
                                  Click to restore this checkpoint
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
