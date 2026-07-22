import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export function Sidebar() {
  const { records, selectedRecordId, selectRecord, setFilterStatus, filterStatus, addRecord, updateRecord, deleteRecord } = useStore();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [errorMsg, setErrorMsg] = useState(null);

  const filteredRecords = records.filter(r => filterStatus === 'all' || r.status === filterStatus);

  const handleEdit = (record) => {
    setEditingId(record.id);
    setEditForm({ name: record.name, description: record.description, capacity: record.capacity, status: record.status });
    setErrorMsg(null);
  };

  const handleSave = (id) => {
    useStore.getState().updateRecord(id, editForm);
    const updated = useStore.getState().records.find(r => r.id === id);
    if(updated.capacity === editForm.capacity && updated.name === editForm.name) {
       setEditingId(null);
       setErrorMsg(null);
    } else {
       setErrorMsg("Invalid data. Capacity must be 1-10. Name max 50 chars.");
    }
  };

  return (
    <div className="w-80 bg-white border-r flex flex-col h-full z-10 shrink-0">
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="text-lg font-semibold mb-2">Scenario Cards</h2>
        <div className="flex gap-2 mb-2">
          <select
            className="w-full border rounded p-1 text-sm bg-white text-black"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600 flex items-center justify-center"
            onClick={() => addRecord({ name: 'New Card', description: '', capacity: 1 })}
            title="Add new record"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredRecords.map(record => (
          <div
            key={record.id}
            className={`p-3 border rounded shadow-sm cursor-pointer transition-colors ${selectedRecordId === record.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
            onClick={() => selectRecord(record.id)}
            data-testid={`record-item-${record.id}`}
          >
            {editingId === record.id ? (
              <div className="space-y-2" onClick={e => e.stopPropagation()}>
                <input
                  className="w-full border p-1 text-sm bg-white text-black"
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Name"
                />
                <input
                  className="w-full border p-1 text-sm bg-white text-black"
                  type="number"
                  value={editForm.capacity}
                  onChange={e => setEditForm({...editForm, capacity: parseInt(e.target.value) || 1})}
                  placeholder="Capacity (1-10)"
                  min="1" max="10"
                />
                <select
                  className="w-full border p-1 text-sm bg-white text-black"
                  value={editForm.status}
                  onChange={e => setEditForm({...editForm, status: e.target.value})}
                >
                  <option value="empty">Empty</option>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="changed">Changed</option>
                  <option value="archived">Archived</option>
                </select>
                {errorMsg && <p className="text-red-500 text-xs">{errorMsg}</p>}
                <div className="flex gap-2">
                  <button className="bg-green-500 text-white px-2 py-1 rounded text-xs" onClick={() => handleSave(record.id)}>Save</button>
                  <button className="bg-gray-300 px-2 py-1 rounded text-xs" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-sm truncate">{record.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(record); }} className="text-gray-500 hover:text-blue-500"><Edit2 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }} className="text-gray-500 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                  <span>Cap: {record.capacity}</span>
                  <span className={`px-1 rounded ${record.status === 'archived' ? 'bg-gray-200' : 'bg-green-100 text-green-800'}`}>{record.status}</span>
                </div>
                {record.position && <div className="text-xs text-blue-500 mt-1">Placed in Composer</div>}
              </div>
            )}
          </div>
        ))}
        {filteredRecords.length === 0 && (
          <div className="text-center text-gray-500 p-4 text-sm">
            No records found. Try clearing filters or creating one.
          </div>
        )}
      </div>
    </div>
  );
}
