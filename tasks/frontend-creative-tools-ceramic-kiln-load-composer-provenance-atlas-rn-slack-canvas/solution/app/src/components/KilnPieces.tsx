import React, { useState } from 'react';
import { useStore } from "../store"; import type { RecordStatus, KilnRecord } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, CheckCircle2 } from 'lucide-react';

export const KilnPieces = () => {
  const records = useStore(state => state.records);
  const addRecord = useStore(state => state.addRecord);
  const updateRecord = useStore(state => state.updateRecord);
  const deleteRecord = useStore(state => state.deleteRecord);
  const selectRecord = useStore(state => state.selectRecord);
  const provenance = useStore(state => state.provenance);

  const [filterStatus, setFilterStatus] = useState<RecordStatus | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<KilnRecord>>({});

  const [newForm, setNewForm] = useState({ name: '', status: 'draft' as RecordStatus, temperature: 0, notes: '' });
  const [newFormError, setNewFormError] = useState('');

  const filteredRecords = filterStatus === 'all'
    ? records
    : records.filter(r => r.status === filterStatus);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim()) {
      setNewFormError('Name is required');
      return;
    }
    setNewFormError('');
    addRecord({ ...newForm, lineage: 'good' });
    setNewForm({ name: '', status: 'draft', temperature: 0, notes: '' });
  };

  const handleStartEdit = (record: KilnRecord) => {
    setEditingId(record.id);
    setEditForm({ name: record.name, status: record.status, temperature: record.temperature, notes: record.notes });
  };

  const handleSaveEdit = (id: string) => {
    if (!editForm.name?.trim()) return; // naive validation
    updateRecord(id, editForm);
    setEditingId(null);
  };

  const statusColors = {
    empty: 'bg-[var(--color-kiln-empty)] text-gray-700',
    draft: 'bg-[var(--color-kiln-draft)] text-gray-800',
    ready: 'bg-[var(--color-kiln-ready)] text-green-800',
    changed: 'bg-[var(--color-kiln-changed)] text-yellow-800',
    archived: 'bg-[var(--color-kiln-archived)] text-red-800'
  };

  return (
    <div className="flex flex-col gap-6 w-full lg:w-1/2 p-6 bg-white border-r border-gray-200">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Kiln Pieces</h2>
        <select
          className="p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as RecordStatus | 'all')}
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Piece Name"
            className={`w-full p-2 border ${newFormError ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
            value={newForm.name}
            onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
            aria-label="New piece name"
          />
          {newFormError && <p className="text-red-500 text-xs mt-1" aria-live="polite">{newFormError}</p>}
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Add
        </button>
      </form>

      <div className="flex flex-col gap-3 flex-grow overflow-y-auto" aria-live="polite">
        <AnimatePresence initial={false}>
          {filteredRecords.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="p-8 text-center text-gray-500"
            >
              No kiln pieces found. Create one to get started.
            </motion.div>
          ) : (
            filteredRecords.map((record) => (
              <motion.div
                layout
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-4 border rounded-lg cursor-pointer transition-shadow ${provenance.selectedRecordId === record.id ? 'ring-2 ring-blue-500 border-transparent shadow-md' : 'border-gray-200 hover:shadow-sm'} ${record.lineage === 'bad' ? 'opacity-50' : ''}`}
                onClick={() => selectRecord(record.id)}
              >
                {editingId === record.id ? (
                  <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="p-1 border border-gray-300 rounded"
                      aria-label="Edit name"
                    />
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm({...editForm, status: e.target.value as RecordStatus})}
                      className="p-1 border border-gray-300 rounded"
                      aria-label="Edit status"
                    >
                      <option value="empty">Empty</option>
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="changed">Changed</option>
                      <option value="archived">Archived</option>
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEdit(record.id)} className="flex items-center text-green-600 hover:text-green-700">
                        <CheckCircle2 size={16} className="mr-1" /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{record.name}</h3>
                      <div className="flex gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[record.status]}`}>
                          {record.status}
                        </span>
                        {record.lineage === 'bad' && (
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-[var(--color-kiln-quarantined)] text-white">
                            Quarantined
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 text-gray-400">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartEdit(record); }}
                        className="p-1 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        aria-label={`Edit ${record.name}`}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                        className="p-1 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                        aria-label={`Delete ${record.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
