import React, { useState } from 'react';
import { useStore } from '../store';
import { type ScenarioStatus } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export const ScenarioList: React.FC = () => {
  const { records, selectedRecordId, selectRecord, addRecord, deleteRecord } = useStore();
  const [filter, setFilter] = useState<ScenarioStatus | 'all'>('all');

  const filteredRecords = records.filter((r) => filter === 'all' || r.status === filter);

  const handleCreate = () => {
    const newId = `rec-${Date.now()}`;
    addRecord({
      id: newId,
      title: 'New Scenario',
      description: '',
      status: 'empty',
      ownerId: null,
      difficulty: 1,
      duration: 30,
    });
    selectRecord(newId);
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card shadow-sm w-full lg:w-80 overflow-hidden">
      <div className="p-4 border-b space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Scenario Cards</h2>
          <button
            onClick={handleCreate}
            className="px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded hover:opacity-90"
          >
            Create
          </button>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="w-full p-2 border rounded bg-background text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 relative">
        <AnimatePresence>
          {filteredRecords.map((record) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={record.id}
              onClick={() => selectRecord(record.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedRecordId === record.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'hover:bg-muted/50 border-transparent hover:border-border'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm truncate pr-2">{record.title}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  record.status === 'ready' ? 'bg-green-100 text-green-700' :
                  record.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                  record.status === 'empty' ? 'bg-gray-100 text-gray-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {record.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex justify-between items-center">
                <span>{record.id}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteRecord(record.id);
                  }}
                  className="text-destructive hover:underline p-1 -m-1"
                  aria-label="Delete"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredRecords.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No records found.
          </div>
        )}
      </div>
    </div>
  );
};
