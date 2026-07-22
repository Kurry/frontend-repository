import { useState } from 'react';
import { useAppStore } from '../store';
import { Plus, Trash2 } from 'lucide-react';
import type { ComponentStatus, FlavorComponent } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export default function FlavorGrid() {
  const records = useAppStore(state => state.records);
  const selectedIds = useAppStore(state => state.selectedIds);
  const selectRecord = useAppStore(state => state.selectRecord);
  const updateRecord = useAppStore(state => state.updateRecord);
  const addRecord = useAppStore(state => state.addRecord);
  const deleteRecord = useAppStore(state => state.deleteRecord);

  const [filter, setFilter] = useState<ComponentStatus | 'all'>('all');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const handleUpdate = (id: string, updates: Partial<FlavorComponent>) => {
    // Basic validation
    if (updates.name !== undefined && updates.name.trim() === '') {
       setErrors(prev => ({...prev, [id]: 'Name is required'}));
       return;
    }
    if (updates.intensity !== undefined) {
      if (isNaN(updates.intensity) || updates.intensity < 1 || updates.intensity > 10) {
        setErrors(prev => ({...prev, [id]: 'Intensity must be 1-10'}));
        return;
      }
    }
    setErrors(prev => {
      const next = {...prev};
      delete next[id];
      return next;
    });
    updateRecord(id, updates);
  };

  const handleCreate = () => {
    addRecord({
      name: 'New Component',
      intensity: 5,
      notes: '',
      status: 'draft'
    });
  };

  return (
    <div className="flex-1 p-4 bg-white rounded shadow flex flex-col min-h-0">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <span className="font-semibold text-gray-700">Filter:</span>
          {(['all', 'empty', 'draft', 'ready', 'changed', 'archived'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-sm transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
        >
          <Plus size={16} />
          <span>New Component</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max overflow-y-auto pr-2 pb-24 md:pb-0">
        <AnimatePresence>
          {filteredRecords.map(record => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              key={record.id}
              onClick={() => selectRecord(record.id, !selectedIds.has(record.id))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectRecord(record.id, !selectedIds.has(record.id));
                }
              }}
              tabIndex={0}
              role="button"
              aria-pressed={selectedIds.has(record.id)}
              className={`p-4 border rounded cursor-pointer transition-colors relative outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${selectedIds.has(record.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
            >
              <div className="flex justify-between items-start mb-2 pr-8">
                <input
                  type="text"
                  value={record.name}
                  onChange={(e) => handleUpdate(record.id, { name: e.target.value })}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    if(e.key === ' ' || e.key === 'Enter') e.stopPropagation();
                  }}
                  className="font-bold text-lg border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent w-full"
                />
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteRecord(record.id);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors z-10"
                title="Delete Record"
                aria-label={`Delete ${record.name}`}
              >
                <Trash2 size={16} />
              </button>

              <div className="mb-2 flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full transition-colors ${
                  record.status === 'ready' ? 'bg-green-100 text-green-800' :
                  record.status === 'empty' ? 'bg-red-100 text-red-800' :
                  record.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  record.status === 'changed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {record.status}
                </span>
              </div>

              <div className="mb-2">
                <label className="text-xs text-gray-500 block">Intensity (1-10)</label>
                <input
                  type="number"
                  min="1" max="10"
                  value={record.intensity}
                  onChange={(e) => handleUpdate(record.id, { intensity: parseInt(e.target.value) })}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    if(e.key === ' ' || e.key === 'Enter') e.stopPropagation();
                  }}
                  className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block">Notes</label>
                <textarea
                  value={record.notes}
                  onChange={(e) => handleUpdate(record.id, { notes: e.target.value })}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    if(e.key === ' ' || e.key === 'Enter') e.stopPropagation();
                  }}
                  className="w-full border rounded px-2 py-1 text-sm h-16 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              {errors[record.id] && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-1 rounded border border-red-200">
                  {errors[record.id]} - Please correct to update.
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
