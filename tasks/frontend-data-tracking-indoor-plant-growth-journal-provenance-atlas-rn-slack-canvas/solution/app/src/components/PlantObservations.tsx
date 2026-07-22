import React, { useState } from 'react';
import { PlantRecord, RecordStatus } from '../store';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface PlantObservationsProps {
  records: PlantRecord[];
  onAddRecord: (record: PlantRecord) => void;
  onEditRecord: (record: PlantRecord) => void;
  onDeleteRecord: (id: string) => void;
  selectedRecordId: string | null;
  onSelectRecord: (id: string | null) => void;
}

export function PlantObservations({
  records,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  selectedRecordId,
  onSelectRecord
}: PlantObservationsProps) {
  const [filter, setFilter] = useState<RecordStatus | 'all'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<PlantRecord>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.species) newErrors.species = 'Species is required';
    if (formData.heightCm !== undefined && formData.heightCm < 0) newErrors.heightCm = 'Height must be non-negative';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingId) {
      onEditRecord({ ...formData, id: editingId } as PlantRecord);
      setEditingId(null);
    } else {
      const newId = `REC-${Date.now().toString().slice(-4)}`;
      onAddRecord({ ...formData, id: newId, status: formData.status || 'draft', quarantined: formData.quarantined || false, sourceEvidence: formData.sourceEvidence || '' } as PlantRecord);
      setIsAdding(false);
    }
    setFormData({});
    setErrors({});
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({});
    setErrors({});
  };

  const startEdit = (r: PlantRecord) => {
    setEditingId(r.id);
    setFormData(r);
    setErrors({});
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Observations</h2>
        <div className="flex gap-2 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as RecordStatus | 'all')}
            className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            aria-label="Filter records"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
            <option value="empty">Empty</option>
          </select>
          <button
            onClick={() => { setIsAdding(true); setFormData({ status: 'draft', heightCm: 0, quarantined: false, sourceEvidence: '' }); }}
            className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
            aria-label="Add record"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(isAdding || editingId) && (
          <div className="p-3 border border-blue-200 bg-blue-50 rounded-md shadow-sm mb-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">{isAdding ? 'New Observation' : 'Edit Observation'}</h3>
            <div className="space-y-2">
              <div>
                <input
                  type="text" placeholder="Name"
                  value={formData.name || ''}
                  onChange={e => { setFormData({...formData, name: e.target.value}); setErrors({...errors, name: ''}); }}
                  className={`w-full text-sm rounded-md border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>
              <div>
                <input
                  type="text" placeholder="Species"
                  value={formData.species || ''}
                  onChange={e => { setFormData({...formData, species: e.target.value}); setErrors({...errors, species: ''}); }}
                  className={`w-full text-sm rounded-md border ${errors.species ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                />
                {errors.species && <p className="text-xs text-red-600 mt-1">{errors.species}</p>}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number" placeholder="Height (cm)"
                    value={formData.heightCm || ''}
                    onChange={e => { setFormData({...formData, heightCm: Number(e.target.value)}); setErrors({...errors, heightCm: ''}); }}
                    className={`w-full text-sm rounded-md border ${errors.heightCm ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  />
                  {errors.heightCm && <p className="text-xs text-red-600 mt-1">{errors.heightCm}</p>}
                </div>
                <div className="flex-1">
                  <select
                    value={formData.status || 'draft'}
                    onChange={e => setFormData({...formData, status: e.target.value as RecordStatus})}
                    className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="changed">Changed</option>
                    <option value="archived">Archived</option>
                    <option value="empty">Empty</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-2 pt-2 border-t border-blue-100 justify-end">
                <button onClick={cancelEdit} className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:underline">Cancel</button>
                <button onClick={handleSave} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-offset-1 focus:ring-blue-500">Save</button>
              </div>
            </div>
          </div>
        )}

        {filteredRecords.length === 0 && !isAdding && (
          <div className="text-center p-8 text-gray-500 text-sm">
            <p>No observations found.</p>
            {filter !== 'all' && <p className="mt-1">Clear the filter to see all records.</p>}
          </div>
        )}

        {filteredRecords.map(r => (
          <div
            key={r.id}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedRecordId === r.id
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : r.quarantined ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onSelectRecord(r.id)}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-medium text-gray-900 text-sm truncate">{r.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                r.status === 'ready' ? 'bg-green-100 text-green-800' :
                r.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                r.status === 'archived' ? 'bg-gray-200 text-gray-600' :
                r.status === 'changed' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-500'
              }`}>{r.status}</span>
            </div>
            <p className="text-xs text-gray-500 mb-2 truncate">{r.species} • {r.heightCm} cm</p>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100/50">
              <span className="text-xs text-gray-400 font-mono">{r.id}</span>
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); startEdit(r); }}
                  className="p-1 text-gray-400 hover:text-blue-600 focus:outline-none focus:text-blue-600 rounded"
                  aria-label={`Edit ${r.name}`}
                ><Edit2 size={14} /></button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteRecord(r.id); }}
                  className="p-1 text-gray-400 hover:text-red-600 focus:outline-none focus:text-red-600 rounded"
                  aria-label={`Delete ${r.name}`}
                ><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
