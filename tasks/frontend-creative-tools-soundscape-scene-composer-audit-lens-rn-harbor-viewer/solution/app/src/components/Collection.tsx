import type React from 'react';
import { useState } from 'react';
import { useStore, RecordStatus, SoundLayerRecord } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { FileAudio, Archive, Trash2, Edit2, Play, AlertCircle, Plus } from 'lucide-react';

export function Collection() {
  const { records, selectedRecordId, selectRecord, addRecord, updateRecord, deleteRecord, undo } = useStore();
  const [filter, setFilter] = useState<RecordStatus | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editVolume, setEditVolume] = useState<number>(50);

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = document.getElementById(`record-${index + 1}`);
      next?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = document.getElementById(`record-${index - 1}`);
      prev?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectRecord(filteredRecords[index].id);
    }
  };

  const getStatusColor = (status: RecordStatus) => {
    switch (status) {
      case 'empty': return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'ready': return 'bg-green-100 text-green-700 border-green-200';
      case 'changed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'archived': return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const startEdit = (record: SoundLayerRecord) => {
    setEditingId(record.id);
    setEditName(record.name);
    setEditVolume(record.volume);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    if (editingId) {
      updateRecord(editingId, { name: editName, volume: Math.min(100, Math.max(0, editVolume)) });
      setEditingId(null);
    }
  };

  const createNewRecord = () => {
    addRecord({
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Layer',
      status: 'empty',
      volume: 50,
      auditLensState: { evidence: '', discrepancy: '', resolved: false }
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FileAudio className="w-5 h-5 text-indigo-600" />
          Sound Layers
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Filter records"
          >
            <option value="all">All States</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={createNewRecord}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
          <button
            onClick={undo}
            className="flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1 rounded-md text-sm font-medium transition-colors"
          >
            Undo
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredRecords.map((record, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={record.id}
            >
              <div
                id={`record-${index}`}
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onClick={() => selectRecord(record.id)}
                className={`p-3 rounded-lg border-2 text-left cursor-pointer transition-all duration-200 outline-none focus:ring-4 focus:ring-indigo-200 ${
                  selectedRecordId === record.id
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                    : 'border-transparent bg-slate-50 hover:bg-slate-100'
                }`}
                role="button"
                aria-selected={selectedRecordId === record.id}
              >
                {editingId === record.id ? (
                  <form onSubmit={saveEdit} className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
                      placeholder="Layer Name"
                      required
                    />
                    <div className="flex items-center gap-2 text-sm">
                      <label>Vol:</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editVolume}
                        onChange={e => setEditVolume(Number(e.target.value))}
                        className="border border-slate-300 rounded px-2 py-1 w-20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-indigo-600 text-white text-xs px-3 py-1 rounded">Save</button>
                      <button type="button" onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-700 text-xs px-3 py-1 rounded">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{record.name}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                        {record.auditLensState.resolved && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                            Audited
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Play className="w-3 h-3" /> Vol: {record.volume}%</span>
                        {record.auditLensState.discrepancy && !record.auditLensState.resolved && (
                          <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Discrepancy</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(record); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-200"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); updateRecord(record.id, { status: 'archived' }); }}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-200"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-200"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredRecords.length === 0 && (
          <div className="text-center text-slate-500 py-10 text-sm">
            No records found for the current filter.
          </div>
        )}
      </div>
    </div>
  );
}
