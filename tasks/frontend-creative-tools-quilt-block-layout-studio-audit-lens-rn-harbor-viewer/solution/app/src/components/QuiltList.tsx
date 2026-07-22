import React, { useState } from 'react';
import { useStore } from '../store';
import type { BlockStatus } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const QuiltList: React.FC = () => {
  const { session, selectedBlockId, selectBlock } = useStore();
  const [filter, setFilter] = useState<BlockStatus | 'all'>('all');

  const filteredRecords = session.records.filter(
    (r) => filter === 'all' || r.status === filter
  );

  const getStatusColor = (status: BlockStatus) => {
    switch (status) {
      case 'empty': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'changed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Collection</h2>
        <div className="flex flex-wrap gap-2">
          {['all', 'empty', 'draft', 'ready', 'changed', 'archived'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={twMerge(
                "px-2 py-1 text-xs font-medium rounded-full border transition-colors",
                filter === f
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence>
          {filteredRecords.length === 0 ? (
            <div className="p-4 text-sm text-center text-slate-500">
              No blocks found.
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredRecords.map((record) => (
                <motion.li
                  key={record.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={() => selectBlock(record.id)}
                    className={twMerge(
                      "w-full text-left p-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                      selectedBlockId === record.id
                        ? "bg-blue-50 border-blue-300 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    )}
                    data-testid={`block-${record.id}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-slate-800 text-sm">
                        {record.name}
                      </span>
                      <span className={clsx("px-2 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wider border", getStatusColor(record.status))}>
                        {record.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex justify-between">
                      <span>{record.patternType}</span>
                      <span>{record.fabricCount} fabrics</span>
                    </div>
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
