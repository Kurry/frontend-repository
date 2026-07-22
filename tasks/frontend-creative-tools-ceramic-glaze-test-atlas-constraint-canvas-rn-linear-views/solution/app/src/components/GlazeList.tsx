import { useState } from 'react';
import { useStore } from '../store';
import type { GlazeRecord, Status } from '../types';
import { Plus, Edit2, Archive, Check, X, Filter } from 'lucide-react';

export const GlazeList = () => {
  const { records, addRecord, updateRecord, archiveRecord, selectedRecordId, setSelectedRecordId } = useStore();
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<GlazeRecord>>({});
  const [error, setError] = useState<string | null>(null);

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const handleSave = (id: string) => {
    if (editForm.name && editForm.name.trim() === '') {
      setError('Name is required');
      return;
    }
    if (editForm.temperature && (editForm.temperature < 1000 || editForm.temperature > 1300)) {
       setError('Temperature must be between 1000 and 1300');
       return;
    }
    updateRecord(id, editForm);
    setIsEditing(null);
    setError(null);
  };

  const handleAdd = () => {
    addRecord({ name: 'New Glaze', baseGlaze: 'Clear', status: 'draft' });
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-stone-200 overflow-hidden">
      <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
        <h2 className="font-semibold text-stone-900">Glaze Tests</h2>
        <button onClick={handleAdd} className="p-1 hover:bg-stone-200 rounded text-stone-600" aria-label="Add record">
          <Plus size={18} />
        </button>
      </div>

      <div className="p-2 border-b border-stone-200 flex items-center space-x-2">
        <Filter size={16} className="text-stone-400" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Status | 'all')}
          className="text-sm border-none bg-transparent outline-none cursor-pointer focus:ring-0 text-stone-600"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="conflict">Conflict</option>
          <option value="resolved">Resolved</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredRecords.length === 0 ? (
          <div className="text-center p-4 text-stone-500 text-sm italic">
            No records match the selected filter.
          </div>
        ) : (
          filteredRecords.map(record => (
            <div
              key={record.id}
              className={`p-3 rounded border text-sm transition-colors cursor-pointer
                ${selectedRecordId === record.id ? 'border-blue-500 bg-blue-50' : 'border-stone-200 hover:border-stone-300'}
                ${record.status === 'archived' ? 'opacity-60' : ''}
              `}
              onClick={() => setSelectedRecordId(record.id)}
              role="button"
              tabIndex={0}
            >
              {isEditing === record.id ? (
                <div className="space-y-2" onClick={e => e.stopPropagation()}>
                  <input
                    className="w-full border p-1 rounded border-stone-300"
                    value={editForm.name || ''}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Name"
                    aria-label="Edit name"
                  />
                  <input
                    className="w-full border p-1 rounded border-stone-300"
                    value={editForm.baseGlaze || ''}
                    onChange={e => setEditForm({ ...editForm, baseGlaze: e.target.value })}
                    placeholder="Base Glaze"
                    aria-label="Edit base glaze"
                  />
                  <input
                    type="number"
                    className="w-full border p-1 rounded border-stone-300"
                    value={editForm.temperature || ''}
                    onChange={e => setEditForm({ ...editForm, temperature: parseInt(e.target.value) || undefined })}
                    placeholder="Temperature (1000-1300)"
                    aria-label="Edit temperature"
                  />
                  {error && <div className="text-xs text-red-500">{error}</div>}
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => { setIsEditing(null); setError(null); }} className="text-stone-500 p-1" aria-label="Cancel edit"><X size={16}/></button>
                    <button onClick={() => handleSave(record.id)} className="text-emerald-600 p-1" aria-label="Save edit"><Check size={16}/></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium text-stone-800">{record.name}</div>
                    <div className="flex space-x-1">
                      <button onClick={(e) => { e.stopPropagation(); setIsEditing(record.id); setEditForm(record); }} className="text-stone-400 hover:text-stone-600" aria-label="Edit record"><Edit2 size={14} /></button>
                      {record.status !== 'archived' && (
                        <button onClick={(e) => { e.stopPropagation(); archiveRecord(record.id); }} className="text-stone-400 hover:text-stone-600" aria-label="Archive record"><Archive size={14} /></button>
                      )}
                    </div>
                  </div>
                  <div className="text-stone-500 text-xs">{record.baseGlaze} {record.temperature ? `• ${record.temperature}°C` : ''}</div>
                  <div className="mt-2 flex justify-between items-center text-xs">
                    <span className={`px-2 py-0.5 rounded-full capitalize
                      ${record.status === 'draft' ? 'bg-amber-100 text-amber-800' : ''}
                      ${record.status === 'ready' ? 'bg-emerald-100 text-emerald-800' : ''}
                      ${record.status === 'empty' ? 'bg-stone-200 text-stone-700' : ''}
                      ${record.status === 'changed' ? 'bg-blue-100 text-blue-800' : ''}
                      ${record.status === 'conflict' ? 'bg-red-100 text-red-800' : ''}
                      ${record.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : ''}
                      ${record.status === 'archived' ? 'bg-stone-200 text-stone-600' : ''}
                    `}>
                      {record.status}
                    </span>
                    <span className="text-stone-400 capitalize">{record.lane}</span>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
