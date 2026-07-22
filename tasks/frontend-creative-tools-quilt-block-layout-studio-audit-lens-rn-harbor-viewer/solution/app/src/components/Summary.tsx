import React from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';

export const Summary: React.FC = () => {
  const { session } = useStore();
  const { derived } = session;

  return (
    <div className="bg-white border-l border-slate-200 h-full p-4 flex flex-col">
      <h2 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Session Summary</h2>

      <div className="space-y-4 flex-1">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 font-medium mb-1">Total Blocks</div>
          <div className="text-2xl font-bold text-slate-800">{derived.totalBlocks}</div>
        </div>

        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-xs text-green-700 font-medium mb-1">Ready / Resolved</div>
          <div className="text-2xl font-bold text-green-800 flex items-baseline gap-2">
            {derived.readyBlocks}
            <span className="text-sm font-normal opacity-70">blocks</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <h3 className="text-xs font-semibold text-slate-800 mb-3 uppercase tracking-wider">Event History</h3>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
          {session.history.slice().reverse().map((event, idx) => (
            <motion.div
              key={`${idx}-${event}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100"
            >
              {event}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
