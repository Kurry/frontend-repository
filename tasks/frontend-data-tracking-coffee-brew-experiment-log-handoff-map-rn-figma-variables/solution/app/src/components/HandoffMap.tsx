import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { ReadinessLevel } from '../types';

const OWNERS = ['Alice', 'Bob', 'Charlie', 'Unassigned'];

export const HandoffMap: React.FC = () => {
  const { records, activeRecordId, connectRecordToHandoffOwner } = useStore();
  const activeRecord = records.find(r => r.id === activeRecordId);
  const mapRef = useRef<HTMLDivElement>(null);

  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [selectedReadiness, setSelectedReadiness] = useState<ReadinessLevel>('low');

  useEffect(() => {
    if (activeRecord) {
      setSelectedOwner(activeRecord.handoffMapState.owner || 'Unassigned');
      setSelectedReadiness(activeRecord.handoffMapState.readiness);
    }
  }, [activeRecordId, activeRecord]);

  const handleApply = () => {
    if (!activeRecord) return;
    const ownerToApply = selectedOwner === 'Unassigned' ? '' : selectedOwner;
    connectRecordToHandoffOwner(activeRecord.id, ownerToApply, selectedReadiness);
  };

  return (
    <div className="flex flex-col h-full bg-stone-100 p-6 relative overflow-hidden">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-stone-800">Handoff Map</h2>
        <p className="text-stone-500 text-sm">Select a record to assign an owner and readiness level.</p>
      </div>

      <div
        ref={mapRef}
        className="flex-1 bg-white border border-stone-300 rounded-lg shadow-inner relative overflow-hidden flex items-center justify-center p-8"
      >
        {!activeRecord ? (
          <div className="text-center text-stone-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <p>Select an experiment to place on the handoff map.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeRecord.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="w-full max-w-md bg-stone-50 border-2 border-stone-800 rounded-xl p-6 shadow-xl"
            >
              <div className="text-lg font-bold text-stone-800 mb-6 text-center border-b border-stone-200 pb-4">
                {activeRecord.title}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2 uppercase tracking-wide">Assign Owner</label>
                  <div className="flex flex-wrap gap-2">
                    {OWNERS.map(owner => (
                      <button
                        key={owner}
                        onClick={() => setSelectedOwner(owner)}
                        className={clsx(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-stone-500",
                          selectedOwner === owner
                            ? "bg-stone-800 text-white shadow-md scale-105"
                            : "bg-white text-stone-600 border border-stone-300 hover:bg-stone-100"
                        )}
                      >
                        {owner}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2 uppercase tracking-wide">Readiness</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as ReadinessLevel[]).map(level => (
                      <button
                        key={level}
                        onClick={() => setSelectedReadiness(level)}
                        className={clsx(
                          "flex-1 py-2 rounded text-sm font-medium transition-all capitalize focus:outline-none focus:ring-2 focus:ring-stone-500",
                          selectedReadiness === level
                            ? (level === 'high' ? "bg-green-500 text-white shadow-md" : level === 'medium' ? "bg-amber-500 text-white shadow-md" : "bg-blue-500 text-white shadow-md")
                            : "bg-white text-stone-600 border border-stone-300 hover:bg-stone-100"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={handleApply}
                    className="flex-1 bg-stone-800 text-white py-3 rounded-lg font-bold hover:bg-stone-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-800 shadow-sm"
                  >
                    Apply Handoff State
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Visual map nodes in background just for context */}
      <div className="absolute top-8 right-8 pointer-events-none opacity-20 flex flex-wrap gap-4 max-w-[200px] justify-end">
         {records.filter(r => r.id !== activeRecordId && r.status !== 'empty' && r.status !== 'draft').map(r => (
           <div key={r.id} className="w-12 h-12 rounded-full border-2 border-stone-800 bg-white flex items-center justify-center text-xs font-bold overflow-hidden" title={r.title}>
             {r.handoffMapState.owner?.charAt(0) || '?'}
           </div>
         ))}
      </div>
    </div>
  );
};
