import React, { useState } from 'react';
import { useStore, STATUSES } from '../store';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export function Collection() {
  const records = useStore((state) => state.records);
  const createRecord = useStore((state) => state.createRecord);
  const updateRecord = useStore((state) => state.updateRecord);
  const deleteRecord = useStore((state) => state.deleteRecord);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const [filter, setFilter] = useState('all');

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const handleEdit = (r) => {
    setEditingId(r.id);
    setEditForm({ ...r });
  };

  const handleSave = () => {
    if (!editForm.title || editForm.measurement < 0 || editForm.measurement > 200) {
      alert("Invalid measurement bounds (0-200) or missing title. Prior valid state preserved. Please correct values.");
      return;
    }
    updateRecord(editingId, editForm);
    setEditingId(null);
  };

  const handleCreate = () => {
    const newId = `record-${Date.now()}`;
    createRecord({ id: newId, title: 'New Annotation', status: 'draft', measurement: 50 });
    setEditingId(newId);
    setEditForm({ id: newId, title: 'New Annotation', status: 'draft', measurement: 50 });
  };

  return (
    <div className="p-4 bg-white rounded shadow h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Fit Annotations Collection</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border p-1 rounded text-sm"
            aria-label="Filter records by status"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-2 py-1 rounded text-sm flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" aria-live="polite">
        {filteredRecords.length === 0 ? (
          <div className="text-gray-500 italic text-center p-4">No annotations found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-2">Title</th>
                <th className="p-2">Measurement (cm)</th>
                <th className="p-2">Status</th>
                <th className="p-2 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  {editingId === r.id ? (
                    <>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="border p-1 w-full"
                          aria-label="Edit title"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={editForm.measurement}
                          onChange={(e) => setEditForm({...editForm, measurement: parseInt(e.target.value, 10)})}
                          className="border p-1 w-full"
                          aria-label="Edit measurement"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          className="border p-1 w-full"
                          aria-label="Edit status"
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-2 flex gap-2">
                        <button onClick={handleSave} className="text-green-600 font-bold text-sm">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-600 font-bold text-sm">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2">{r.title}</td>
                      <td className="p-2">{r.measurement}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${r.status === 'conflict' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2 flex gap-2">
                        <button onClick={() => handleEdit(r)} className="text-blue-600" aria-label={`Edit ${r.title}`}><Edit2 size={16} /></button>
                        <button onClick={() => {
                          if (window.confirm("Are you sure?")) deleteRecord(r.id);
                        }} className="text-red-600" aria-label={`Delete ${r.title}`}><Trash2 size={16} /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
