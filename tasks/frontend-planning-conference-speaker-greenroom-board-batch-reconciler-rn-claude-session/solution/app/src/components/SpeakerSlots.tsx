import React, { useState } from 'react';
import { useStore } from '../store';
import type { SpeakerSlot, SlotStatus } from '../store';
import { Plus, Edit2, Archive, Trash2, CheckSquare, Square, Check, X } from 'lucide-react';

export const SpeakerSlots: React.FC = () => {
  const { records, addRecord, updateRecord, archiveRecord, toggleSelection, selectAll, clearSelection, selectedIds } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<SlotStatus | 'all'>('all');

  const activeRecords = records.filter(r => filter === 'all' ? true : r.status === filter);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Speaker Slots</h2>
        <div className="flex gap-4">
          <select
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            value={filter}
            onChange={(e) => setFilter(e.target.value as SlotStatus | 'all')}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} /> New Slot
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={selectAll} className="text-sm text-indigo-600 hover:text-indigo-800">Select All</button>
        <button onClick={clearSelection} className="text-sm text-gray-500 hover:text-gray-700">Clear Selection</button>
      </div>

      <div className="space-y-4">
        {isAdding && (
          <SlotEditor
            onSave={(record) => {
              addRecord(record);
              setIsAdding(false);
            }}
            onCancel={() => setIsAdding(false)}
          />
        )}

        {activeRecords.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No speaker slots found matching criteria.
          </div>
        )}

        {activeRecords.map(record => (
          <div key={record.id} className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 ${
            selectedIds.has(record.id) ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}>
            <button
              onClick={() => toggleSelection(record.id)}
              className="mt-1 text-gray-400 hover:text-indigo-600 transition-colors"
            >
              {selectedIds.has(record.id) ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} />}
            </button>

            <div className="flex-1">
              {editingId === record.id ? (
                <SlotEditor
                  initialData={record}
                  onSave={(updates) => {
                    updateRecord(record.id, updates);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{record.speakerName}</h3>
                    <p className="text-sm text-gray-600 mt-1">{record.topic}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>{record.startTime}</span>
                      <span>{record.durationMinutes} min</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.status === 'ready' ? 'bg-green-100 text-green-800' :
                      record.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                      record.status === 'changed' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {record.status}
                    </span>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setEditingId(record.id)} className="text-gray-400 hover:text-indigo-600 transition-colors p-1" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      {record.status !== 'archived' && (
                        <button onClick={() => archiveRecord(record.id)} className="text-gray-400 hover:text-yellow-600 transition-colors p-1" title="Archive">
                          <Archive size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface SlotEditorProps {
  initialData?: Omit<SpeakerSlot, 'id' | 'status'>;
  onSave: (data: Omit<SpeakerSlot, 'id' | 'status'>) => void;
  onCancel: () => void;
}

const SlotEditor: React.FC<SlotEditorProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    speakerName: initialData?.speakerName || '',
    topic: initialData?.topic || '',
    startTime: initialData?.startTime || '09:00',
    durationMinutes: initialData?.durationMinutes || 30,
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.speakerName.trim() || !formData.topic.trim()) {
      setError('Speaker name and topic are required.');
      return;
    }

    if (formData.durationMinutes < 5 || formData.durationMinutes > 240) {
      setError('Duration must be between 5 and 240 minutes.');
      return;
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.startTime)) {
      setError('Start time must be in HH:mm format.');
      return;
    }

    onSave(formData as any);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Speaker Name</label>
          <input
            type="text"
            className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2"
            value={formData.speakerName}
            onChange={(e) => setFormData({...formData, speakerName: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Topic</label>
          <input
            type="text"
            className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2"
            value={formData.topic}
            onChange={(e) => setFormData({...formData, topic: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Start Time (HH:mm)</label>
          <input
            type="time"
            className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2"
            value={formData.startTime}
            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Duration (minutes)</label>
          <input
            type="number"
            className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 border p-2"
            value={formData.durationMinutes}
            onChange={(e) => setFormData({...formData, durationMinutes: parseInt(e.target.value) || 0})}
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onCancel} className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-200">
          <X size={18} />
        </button>
        <button type="submit" className="p-2 text-green-600 hover:text-green-800 transition-colors rounded-md hover:bg-green-100">
          <Check size={18} />
        </button>
      </div>
    </form>
  );
};
