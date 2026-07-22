import React, { useState } from 'react';
import { useStore } from '../store';
import { Archive, Edit2, CheckCircle2, FileEdit, CircleDashed, Filter, Plus, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_ICONS = {
  empty: <CircleDashed size={16} className="text-slate-400" />,
  draft: <FileEdit size={16} className="text-blue-500" />,
  ready: <CheckCircle2 size={16} className="text-emerald-500" />,
  changed: <Edit2 size={16} className="text-amber-500" />,
  archived: <Archive size={16} className="text-slate-500" />
};

export function Sidebar({ selectedId, onSelect }) {
  const records = useStore(state => state.records);
  const createRecord = useStore(state => state.createRecord);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredRecords = filterStatus === 'all'
    ? records
    : records.filter(r => r.status === filterStatus);

  const handleCreate = () => {
    createRecord({ title: 'New Bike Service', status: 'draft' });
  };

  return (
    <div className="w-full md:w-80 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-200 font-semibold text-slate-800 shrink-0 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span>Service Records</span>
          <button
            onClick={handleCreate}
            className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            title="Create Record"
            data-testid="create-record-btn"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-slate-200 rounded p-1 flex-1 bg-slate-50 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filteredRecords.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-3">
             <Bike size={32} className="opacity-20" />
             <p className="text-sm">No records found for this filter.</p>
             {filterStatus !== 'all' && (
               <button
                 onClick={() => setFilterStatus('all')}
                 className="text-blue-500 text-xs hover:underline"
               >
                 Clear Filter
               </button>
             )}
           </div>
        ) : (
          <div className="space-y-1 pb-4">
            <AnimatePresence>
              {filteredRecords.map(record => (
                <motion.button
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={record.id}
                  onClick={() => onSelect(record.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all text-sm flex items-start gap-3
                    ${selectedId === record.id
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }
                  `}
                  data-testid={`record-${record.id}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {STATUS_ICONS[record.status] || STATUS_ICONS.empty}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900 truncate">
                      {record.title || 'Untitled Record'}
                    </div>
                    <div className="text-slate-500 text-xs mt-1 flex gap-2">
                      <span className="capitalize">{record.status}</span>
                      <span className="text-slate-300">•</span>
                      <span>{record.mileage} miles</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
