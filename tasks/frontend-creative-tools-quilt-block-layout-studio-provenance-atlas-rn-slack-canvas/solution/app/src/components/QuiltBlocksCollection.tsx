import { useState } from 'react';
import { useStore } from '../store';
import { QuiltBlockType, QuiltBlockStatusType } from '../schema';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const QuiltBlocksCollection = () => {
  const { records, createBlock, editBlock, deleteBlock, activeRecordId, setActiveRecordId } = useStore();
  const [filter, setFilter] = useState<QuiltBlockStatusType | 'all'>('all');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<QuiltBlockType>>({});
  const [errorMsg, setErrorMsg] = useState('');

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  // Undo keyboard shortcut (Ctrl+Z / Cmd+Z) handled globally in App.tsx

  const handleCreate = () => {
    createBlock({
      name: 'New Block',
      status: 'empty',
      color: '#ffffff',
      pieces: 1
    });
  };

  const startEdit = (record: QuiltBlockType) => {
    setIsEditing(record.id);
    setEditForm(record);
    setErrorMsg('');
  };

  const saveEdit = (id: string) => {
    if (!editForm.name || editForm.name.trim() === '') {
      setErrorMsg('Name is required');
      return;
    }
    if (!editForm.color?.match(/^#[0-9a-fA-F]{6}$/)) {
      setErrorMsg('Invalid hex color');
      return;
    }
    if (editForm.pieces === undefined || editForm.pieces < 1 || editForm.pieces > 100) {
      setErrorMsg('Pieces must be between 1 and 100');
      return;
    }
    editBlock(id, editForm);
    setIsEditing(null);
    setErrorMsg('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <h2 className="text-xl font-bold">Collection</h2>
        <div className="flex gap-2 items-center">
          <select
            className="border p-2 rounded text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            aria-label="Filter blocks"
          >
            <option value="all">All</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded flex items-center gap-1"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-100 text-red-700 p-2 rounded border border-red-200">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
        <AnimatePresence>
          {filteredRecords.map(record => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={record.id}
              className={`border p-4 rounded-lg flex flex-col gap-2 cursor-pointer transition-colors ${activeRecordId === record.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300' : 'bg-white hover:border-gray-400'}`}
              onClick={() => setActiveRecordId(record.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if(e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveRecordId(record.id);
                }
              }}
            >
              {isEditing === record.id ? (
                <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    className="border p-1 rounded"
                    value={editForm.name || ''}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    placeholder="Name"
                    autoFocus
                  />
                  <select
                    className="border p-1 rounded"
                    value={editForm.status || 'empty'}
                    onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                  >
                    <option value="empty">Empty</option>
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="changed">Changed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <input
                    type="color"
                    className="h-8 w-full cursor-pointer"
                    value={editForm.color || '#ffffff'}
                    onChange={e => setEditForm({...editForm, color: e.target.value})}
                  />
                  <input
                    type="number"
                    className="border p-1 rounded"
                    value={editForm.pieces || 1}
                    min={1} max={100}
                    onChange={e => setEditForm({...editForm, pieces: parseInt(e.target.value)})}
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => saveEdit(record.id)} className="bg-green-600 text-white px-2 py-1 rounded text-sm flex-1">Save</button>
                    <button onClick={() => setIsEditing(null)} className="bg-gray-300 px-2 py-1 rounded text-sm flex-1">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold truncate pr-2">{record.name}</h3>
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); startEdit(record); }} className="p-1 text-gray-500 hover:text-blue-600 focus:outline-none focus:ring"><Edit2 size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteBlock(record.id); }} className="p-1 text-gray-500 hover:text-red-600 focus:outline-none focus:ring"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center text-sm">
                    <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 capitalize">{record.status}</span>
                    <span className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: record.color }}></div>
                      {record.pieces} pcs
                    </span>
                  </div>
                  {record.provenanceState !== 'idle' && (
                    <div className={`text-xs p-1 rounded ${record.provenanceState === 'conflict' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      Prov: {record.provenanceState}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredRecords.length === 0 && (
          <div className="col-span-1 sm:col-span-2 text-center text-gray-500 py-8 border-2 border-dashed rounded-lg">
            No blocks found.
          </div>
        )}
      </div>
    </div>
  );
};
