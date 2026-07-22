import React, { useState } from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';
import { Trash2, Edit2, Play, AlertCircle } from 'lucide-react';

export function KilnPieces() {
  const { records, deleteRecord, selectForAudit, auditLensState } = useStore();
  const [filter, setFilter] = useState('all');

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-800">Kiln Pieces</h2>
        <select
          className="bg-neutral-50 border border-neutral-200 text-sm rounded-lg px-3 py-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="resolved">Resolved</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p>No records found. Create one to begin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map(record => (
            <motion.div
              layout
              key={record.id}
              className={`p-4 rounded-lg border flex items-center justify-between ${auditLensState.selectedId === record.id ? 'border-blue-500 bg-blue-50' : 'border-neutral-200 hover:border-neutral-300'}`}
            >
              <div>
                <h3 className="font-medium text-neutral-900">{record.title || 'Untitled'}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    record.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    record.status === 'conflict' ? 'bg-red-100 text-red-700' :
                    record.status === 'changed' ? 'bg-amber-100 text-amber-700' :
                    'bg-neutral-100 text-neutral-600'
                  }`}>
                    {record.status}
                  </span>
                  <span className="text-xs text-neutral-500">{record.id}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => selectForAudit(record.id)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                  title="Select for Audit Lens"
                  aria-label="Select for Audit Lens"
                >
                  <Play size={18} />
                </button>
                <button
                  onClick={() => deleteRecord(record.id)}
                  className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  aria-label="Delete record"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
