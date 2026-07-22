import { useState } from 'react';
import { useAppStore } from './store';
import type { PetCareEvent, EventStatus } from './types';
import { Plus, Trash2, Edit3, X } from 'lucide-react';

export function EventList() {
  const records = useAppStore(state => state.records);
  const editor = useAppStore(state => state.editor);
  const addRecord = useAppStore(state => state.addRecord);
  const deleteRecord = useAppStore(state => state.deleteRecord);
  const selectRecord = useAppStore(state => state.selectRecord);
  const updateRecord = useAppStore(state => state.updateRecord);

  const [filter, setFilter] = useState<EventStatus | 'all'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium' as any });

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const handleSave = () => {
    if (!formData.title.trim()) return;

    if (editingId) {
      updateRecord(editingId, { title: formData.title, description: formData.description, priority: formData.priority });
      setEditingId(null);
    } else {
      addRecord({
        title: formData.title,
        description: formData.description,
        status: 'draft',
        priority: formData.priority,
        date: new Date().toISOString(),
        projectedOutcome: 'To be determined',
      });
      setIsCreating(false);
    }
    setFormData({ title: '', description: '', priority: 'medium' });
  };

  const startEdit = (record: PetCareEvent) => {
    setEditingId(record.id);
    setFormData({ title: record.title, description: record.description, priority: record.priority });
    setIsCreating(true);
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Events Collection</h2>
        <select
          className="text-sm border rounded px-2 py-1"
          value={filter}
          onChange={(e) => setFilter(e.target.value as EventStatus | 'all')}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
          <option value="empty">Empty</option>
        </select>
      </div>

      <div className="p-4 border-b">
        {!isCreating ? (
          <button
            onClick={() => { setIsCreating(true); setEditingId(null); setFormData({ title: '', description: '', priority: 'medium' }); }}
            className="w-full py-2 flex items-center justify-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Event
          </button>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md border">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-sm">{editingId ? 'Edit Event' : 'New Event'}</h4>
              <button onClick={() => { setIsCreating(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Event title"
              className="w-full mb-2 p-2 text-sm border rounded"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
            <input
              type="text"
              placeholder="Description"
              className="w-full mb-2 p-2 text-sm border rounded"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
            <select
               className="w-full mb-3 p-2 text-sm border rounded bg-white"
               value={formData.priority}
               onChange={e => setFormData({...formData, priority: e.target.value as any})}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <button
              onClick={handleSave}
              disabled={!formData.title.trim()}
              className="w-full py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Save Event
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            No events found.
          </div>
        ) : (
          filteredRecords.map(record => {
            const isSelected = editor.selectedRecordId === record.id;
            return (
              <div
                key={record.id}
                onClick={() => selectRecord(record.id)}
                className={`p-3 border rounded-md cursor-pointer transition-all ${
                  isSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">{record.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{record.status} • {record.priority} priority</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(record); }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
