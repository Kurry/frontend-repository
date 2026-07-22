import React, { useState } from 'react';
import { useStore, type RecordStatus } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Archive as ArchiveIcon, AlertCircle, Edit2, Check, X, ArrowUp, ArrowDown } from 'lucide-react';

export const RecipeIngredients: React.FC<{
  onSelect: (id: string) => void;
  selectedId: string | null;
}> = ({ onSelect, selectedId }) => {
  const { records, addRecord, deleteRecord, archiveRecord, updateRecord, reorderRecords } = useStore();
  const [filter, setFilter] = useState<RecordStatus | 'all'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newRecord, setNewRecord] = useState({ name: '', quantity: 1, unit: 'cups' });
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', quantity: 1, unit: '' });

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  const handleAdd = () => {
    if (!newRecord.name.trim() || newRecord.quantity <= 0 || !newRecord.unit.trim()) {
      setError("Please fill all fields with valid values. Exact field boundaries are accepted.");
      return;
    }
    setError(null);
    addRecord(newRecord);
    setIsAdding(false);
    setNewRecord({ name: '', quantity: 1, unit: 'cups' });
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setError(null);
  };

  const startEdit = (e: React.MouseEvent, record: any) => {
    e.stopPropagation();
    setEditingId(record.id);
    setEditForm({ name: record.name, quantity: record.quantity, unit: record.unit });
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const saveEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!editForm.name.trim() || editForm.quantity <= 0 || !editForm.unit.trim()) {
      alert("Invalid fields");
      return;
    }
    updateRecord(id, editForm);
    setEditingId(null);
  };

  const moveRecord = (e: React.MouseEvent, id: string, direction: 'up' | 'down') => {
    e.stopPropagation();
    const index = records.findIndex(r => r.id === id);
    if (index === -1) return;

    let targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < records.length) {
      reorderRecords(index, targetIndex);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Recipe Ingredients</h2>
        <div className="flex gap-2">
          <select
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="empty">Empty (Failed)</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white p-1 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label="Add Ingredient"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 p-3 rounded-md border border-blue-100 overflow-hidden mb-3"
            >
              <div className="space-y-3">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={newRecord.name}
                    onChange={(e) => setNewRecord({...newRecord, name: e.target.value})}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                      value={newRecord.quantity}
                      onChange={(e) => setNewRecord({...newRecord, quantity: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700">Unit</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                      value={newRecord.unit}
                      onChange={(e) => setNewRecord({...newRecord, unit: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={handleCancelAdd} className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1">Cancel</button>
                  <button onClick={handleAdd} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Save</button>
                </div>
              </div>
            </motion.div>
          )}

          {filteredRecords.map((record, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={record.id}
              className={`p-3 rounded-md border transition-all ${
                selectedId === record.id
                  ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50 shadow-sm'
              }`}
              onClick={() => onSelect(record.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(record.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-pressed={selectedId === record.id}
            >
              {editingId === record.id ? (
                <div className="space-y-2 cursor-default" onClick={e => e.stopPropagation()}>
                   <div>
                    <input
                      type="text"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="block w-1/2 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm({...editForm, quantity: parseFloat(e.target.value)})}
                    />
                    <input
                      type="text"
                      className="block w-1/2 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                      value={editForm.unit}
                      onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={cancelEdit} className="p-1 text-gray-500 hover:text-gray-700 bg-gray-100 rounded">
                      <X size={16} />
                    </button>
                    <button onClick={(e) => saveEdit(e, record.id)} className="p-1 text-green-600 hover:text-green-800 bg-green-100 rounded">
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{record.name}</h3>
                      <p className="text-xs text-gray-500">{record.quantity} {record.unit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                        record.status === 'ready' ? 'bg-green-100 text-green-800' :
                        record.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        record.status === 'empty' ? 'bg-red-100 text-red-800' :
                        record.status === 'changed' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      {filter === 'all' && (
                        <>
                          <button onClick={(e) => moveRecord(e, record.id, 'up')} className="p-1 text-gray-400 hover:text-gray-700 bg-gray-100 rounded" title="Move Up" disabled={index === 0}>
                            <ArrowUp size={14} />
                          </button>
                          <button onClick={(e) => moveRecord(e, record.id, 'down')} className="p-1 text-gray-400 hover:text-gray-700 bg-gray-100 rounded" title="Move Down" disabled={index === filteredRecords.length - 1}>
                            <ArrowDown size={14} />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => startEdit(e, record)}
                        className="p-1 text-blue-400 hover:text-blue-700 bg-blue-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      {record.status !== 'archived' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); archiveRecord(record.id); }}
                          className="p-1 text-gray-400 hover:text-gray-700 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                          title="Archive"
                        >
                          <ArchiveIcon size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                        className="p-1 text-red-400 hover:text-red-700 bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
          {filteredRecords.length === 0 && !isAdding && (
            <div className="text-center py-8 text-gray-500 text-sm italic">
              No records match the current filter.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
