import React, { useState } from 'react';
import { useStore, store } from '../store';
import { Settings, Plus, Edit, Trash2 } from 'lucide-react';

export default function RecordList() {
  const records = useStore(s => s.records);
  const filter = useStore(s => s.filter);
  const selectedRecordId = useStore(s => s.selectedRecordId);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  const handleSelect = (id) => {
    store.dispatch({ type: 'SELECT_RECORD', payload: id });
  };

  const handleFilter = (e) => {
    store.dispatch({ type: 'SET_FILTER', payload: e.target.value });
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditForm(record);
  };

  const saveEdit = () => {
    if (!editForm.name || !editForm.type) return;
    store.dispatch({ type: 'UPDATE_RECORD', payload: editForm });
    setEditingId(null);
  };

  const createNew = () => {
      const newRec = {
          id: `rec-${Date.now()}`,
          name: 'New Appliance',
          type: 'Washer',
          status: 'empty',
          date: new Date().toISOString().split('T')[0],
          capacity: 1
      };
      store.dispatch({ type: 'CREATE_RECORD', payload: newRec });
  }

  const deleteRec = (id) => {
      if(confirm('Are you sure you want to delete this record?')) {
         store.dispatch({ type: 'DELETE_RECORD', payload: { id } });
      }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-500" />
          Records
        </h2>
        <button onClick={createNew} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="Create record">
            <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b border-slate-200 bg-white shrink-0">
        <select
          value={filter}
          onChange={handleFilter}
          className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filteredRecords.map(record => (
          <div
            key={record.id}
            onClick={() => handleSelect(record.id)}
            className={`p-3 mb-2 rounded border cursor-pointer transition-colors ${
              selectedRecordId === record.id
                ? 'bg-blue-50 border-blue-300 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            {editingId === record.id ? (
              <div className="space-y-2" onClick={e => e.stopPropagation()}>
                <input
                  className="w-full border rounded p-1 text-sm"
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                />
                <select
                  className="w-full border rounded p-1 text-sm"
                  value={editForm.status}
                  onChange={e => setEditForm({...editForm, status: e.target.value})}
                >
                  <option value="empty">Empty</option>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="changed">Changed</option>
                  <option value="archived">Archived</option>
                </select>
                <div className="flex gap-2 justify-end mt-2">
                  <button className="text-xs px-2 py-1 bg-slate-200 rounded" onClick={() => setEditingId(null)}>Cancel</button>
                  <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded" onClick={saveEdit}>Save</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-slate-800">{record.name}</div>
                  <div className="flex gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      record.status === 'empty' ? 'bg-slate-100 text-slate-600' :
                      record.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                      record.status === 'ready' ? 'bg-green-100 text-green-700' :
                      record.status === 'changed' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-200 text-slate-500'
                    }`}>
                      {record.status}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); startEdit(record); }} className="text-slate-400 hover:text-slate-600 ml-1">
                        <Edit className="w-3 h-3" />
                    </button>
                     <button onClick={(e) => { e.stopPropagation(); deleteRec(record.id); }} className="text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {record.type} • Cap: {record.capacity} • {record.date}
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredRecords.length === 0 && (
          <div className="text-center text-slate-500 mt-8 text-sm">No records found.</div>
        )}
      </div>
    </div>
  );
}
