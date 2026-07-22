import { useState, useMemo } from 'react';
import { useStore, type BrewExperiment } from '../store';
import { BrewForm } from './BrewForm';
import { Plus, Edit2, Trash2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function BrewList() {
  const records = useStore(state => state.records);
  const deleteRecord = useStore(state => state.deleteRecord);
  const [editingRecord, setEditingRecord] = useState<BrewExperiment | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRecords = useMemo(() => {
    if (statusFilter === 'all') return records;
    return records.filter(r => r.status === statusFilter);
  }, [records, statusFilter]);

  const handleEdit = (record: BrewExperiment) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setEditingRecord(undefined);
    setIsFormOpen(true);
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ready: 'bg-green-100 text-green-800 border-green-200',
    changed: 'bg-blue-100 text-blue-800 border-blue-200',
    archived: 'bg-gray-100 text-gray-800 border-gray-200',
    empty: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-4 bg-white border-b flex justify-between items-center sticky top-0 z-10">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Brew Experiments <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{filteredRecords.length}</span>
        </h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border-gray-300 rounded p-1"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
              <option value="empty">Empty</option>
            </select>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label="New Experiment"
          >
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-white rounded shadow-sm border border-dashed border-gray-300">
            <p>No experiments found.</p>
            <button onClick={handleNew} className="text-blue-600 hover:underline mt-2 text-sm">Create one now</button>
          </div>
        ) : (
          <div className="grid gap-3 max-w-full">
            <AnimatePresence>
              {filteredRecords.map(record => (
                <motion.div
                  key={record.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border rounded shadow-sm p-4 hover:shadow-md transition-shadow relative group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{record.title}</h3>
                      <p className="text-xs text-gray-500">{record.date} • {record.coffee} ({record.roaster})</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded border ${statusColors[record.status]}`}>
                      {record.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs block">Method</span>
                      {record.brewMethod || '-'}
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">Dose / Yield</span>
                      {record.dose}g / {record.yield}g
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">Time</span>
                      {record.time || '-'}
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">Grind</span>
                      {record.grindSetting || '-'}
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(record)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      aria-label={`Edit ${record.title}`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteRecord(record.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      aria-label={`Delete ${record.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {isFormOpen && (
        <BrewForm
          initialData={editingRecord}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
