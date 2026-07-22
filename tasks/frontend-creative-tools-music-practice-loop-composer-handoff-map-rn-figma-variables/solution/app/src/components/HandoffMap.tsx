import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { motion, useReducedMotion } from 'framer-motion';
import { Readiness } from '../types';
import { User, CheckCircle2, Circle } from 'lucide-react';

export function HandoffMap() {
  const { records, selectedRecordId, assignOwnerAndReadiness } = useAppStore();
  const shouldReduceMotion = useReducedMotion();

  const selectedRecord = records.find(r => r.id === selectedRecordId);
  const [ownerInput, setOwnerInput] = useState('');

  useEffect(() => {
    if (selectedRecord) {
      setOwnerInput(selectedRecord.owner || '');
    }
  }, [selectedRecordId, selectedRecord?.owner]);

  if (!selectedRecord) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 max-w-sm">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <User size={32} />
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-2">No segment selected</h3>
          <p className="text-sm text-slate-500">Select a practice segment from the list to connect it to a handoff owner and update readiness.</p>
        </div>
      </div>
    );
  }

  const handleAssign = (readiness: Readiness) => {
    if (!ownerInput.trim()) return;
    assignOwnerAndReadiness(selectedRecord.id, ownerInput.trim(), readiness);
  };

  const getReadinessColor = (readiness: string, isActive: boolean) => {
    if (!isActive) return 'bg-white border-slate-200 text-slate-500 hover:border-slate-300';
    switch(readiness) {
      case 'not_ready': return 'bg-slate-100 border-slate-400 text-slate-800';
      case 'ready_for_handoff': return 'bg-blue-50 border-blue-400 text-blue-800';
      case 'handoff_complete': return 'bg-green-50 border-green-400 text-green-800';
      default: return '';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      <div className="p-6 border-b border-slate-200 bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800 mb-1">{selectedRecord.name}</h2>
        <div className="flex items-center text-sm text-slate-500">
          <span className="capitalize px-2 py-0.5 bg-slate-200 rounded-full text-xs mr-2">{selectedRecord.domainState}</span>
          Current Status
        </div>
      </div>

      <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Handoff Owner</h3>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Enter owner name..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                value={ownerInput}
                onChange={(e) => setOwnerInput(e.target.value)}
                aria-label="Owner Name"
              />
            </div>
          </div>
          {!ownerInput.trim() && <p className="text-xs text-amber-600 mt-2">Owner name is required to assign readiness.</p>}
        </div>

        <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Readiness State</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['not_ready', 'ready_for_handoff', 'handoff_complete'] as Readiness[]).map((state) => {
            const isActive = selectedRecord.readiness === state;
            const disabled = !ownerInput.trim();

            return (
              <motion.button
                key={state}
                whileHover={!disabled && !isActive && !shouldReduceMotion ? { scale: 1.02, y: -2 } : {}}
                whileTap={!disabled && !isActive && !shouldReduceMotion ? { scale: 0.98 } : {}}
                onClick={() => handleAssign(state)}
                disabled={disabled}
                className={`relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${getReadinessColor(state, isActive)} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500`}
                aria-pressed={isActive}
                aria-label={`Set readiness to ${state.replace(/_/g, ' ')}`}
              >
                {isActive && !shouldReduceMotion && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 bg-current opacity-[0.03] rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="mb-3">
                  {isActive ? <CheckCircle2 size={32} className="text-current" /> : <Circle size={32} className="text-slate-300" />}
                </div>
                <span className="font-medium text-center text-sm capitalize">
                  {state.replace(/_/g, ' ')}
                </span>

                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-2.5 bg-current text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                  >
                    Current
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  );
}
