import React, { useState } from 'react';
import { useStore } from '../store';
import { RecordItem } from './RecordItem';
import { DomainStatus } from '../types';
import { Plus, Filter } from 'lucide-react';

export const PracticeSegments: React.FC = () => {
  const { records, addRecord, updateRecord, deleteRecord, reorderRecords, auditLens, selectRecordForAudit } = useStore();
  const [filter, setFilter] = useState<DomainStatus | 'all'>('all');
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [instrument, setInstrument] = useState('');
  const [bpm, setBpm] = useState<number | ''>(120);
  const [status, setStatus] = useState<DomainStatus>('draft');
  const [error, setError] = useState<string | null>(null);

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const resetForm = () => {
    setIsEditing(null);
    setTitle('');
    setInstrument('');
    setBpm(120);
    setStatus('draft');
    setError(null);
  };

  const handleEdit = (id: string) => {
    const record = records.find(r => r.id === id);
    if (record) {
      setIsEditing(id);
      setTitle(record.title);
      setInstrument(record.instrument);
      setBpm(record.bpm);
      setStatus(record.status);
      setError(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!instrument.trim()) {
      setError('Instrument is required.');
      return;
    }
    if (typeof bpm !== 'number' || bpm < 1 || bpm > 300) {
      setError('BPM must be a number between 1 and 300.');
      return;
    }

    if (isEditing) {
      updateRecord(isEditing, { title, instrument, bpm, status });
    } else {
      addRecord({
        id: crypto.randomUUID(),
        title,
        instrument,
        bpm,
        status,
        auditConflict: Math.random() > 0.7 ? 'Missing source validation' : undefined
      });
    }
    resetForm();
  };

  const moveRecord = (index: number, direction: -1 | 1) => {
    if (filter !== 'all') return;
    const newRecords = [...records];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newRecords.length) {
      const temp = newRecords[index];
      newRecords[index] = newRecords[targetIndex];
      newRecords[targetIndex] = temp;
      reorderRecords(newRecords);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Practice Segments</h2>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border-slate-200 rounded-md py-1.5 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Filter records"
          >
            <option value="all">All States</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {isEditing !== null && (
        <form onSubmit={handleSave} className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">
            {isEditing ? 'Edit Segment' : 'New Segment'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Instrument</label>
              <input
                type="text"
                value={instrument}
                onChange={e => setInstrument(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">BPM</label>
              <input
                type="number"
                value={bpm}
                onChange={e => setBpm(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as DomainStatus)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="empty">Empty</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {error && <div className="text-red-600 text-sm mb-3 font-medium bg-red-50 p-2 rounded">{error}</div>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save Record
            </button>
          </div>
        </form>
      )}

      {isEditing === null && (
        <button
          onClick={() => setIsEditing('')}
          className="mb-6 flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Plus size={20} />
          <span className="font-medium">Add New Segment</span>
        </button>
      )}

      <div className="flex-1 overflow-y-auto pr-2 pb-20">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-500">No records found.</p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const actualIndex = records.findIndex(r => r.id === record.id);
            return (
              <RecordItem
                key={record.id}
                record={record}
                onEdit={handleEdit}
                onDelete={(id) => {
                  if (confirm('Are you sure you want to delete this record?')) {
                    deleteRecord(id);
                  }
                }}
                onSelectAudit={selectRecordForAudit}
                onMoveUp={() => moveRecord(actualIndex, -1)}
                onMoveDown={() => moveRecord(actualIndex, 1)}
                isSelected={auditLens.selectedRecordId === record.id}
              />
            )
          })
        )}
      </div>
    </div>
  );
};
