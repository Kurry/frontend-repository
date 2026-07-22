import React, { useState } from 'react';
import { useStore, addRecord, updateRecord, deleteRecord } from '../store';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function IntakeEvents() {
  const { records } = useStore();
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ amount: '', time: '', status: 'draft' });
  const [error, setError] = useState(null);

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const handleEdit = (record) => {
    setEditingId(record.id);
    setEditForm({ amount: record.amount, time: record.time.slice(0, 16), status: record.status });
    setError(null);
  };

  const handleSave = (id) => {
    const amount = Number(editForm.amount);
    if (isNaN(amount) || amount <= 0 || amount > 5000) {
      setError('Amount must be between 1 and 5000 ml');
      return;
    }
    updateRecord(id, {
      amount,
      time: new Date(editForm.time).toISOString(),
      status: editForm.status
    });
    setEditingId(null);
    setError(null);
  };

  const handleCreate = () => {
    const amount = Number(editForm.amount);
    if (isNaN(amount) || amount <= 0 || amount > 5000) {
      setError('Amount must be between 1 and 5000 ml');
      return;
    }
    const newRecord = {
      id: `record-${Date.now()}`,
      amount,
      time: new Date(editForm.time || Date.now()).toISOString(),
      status: editForm.status
    };
    addRecord(newRecord);
    setEditingId(null);
    setError(null);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Intake Events</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border p-2 rounded text-sm bg-gray-50"
            aria-label="Filter events"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => { setEditingId('new'); setEditForm({ amount: 250, time: new Date().toISOString().slice(0, 16), status: 'draft' }); setError(null); }}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition"
          >
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</div>}

      <div className="overflow-y-auto max-h-[400px] border rounded">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 sticky top-0">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Amount (ml)</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {editingId === 'new' && (
              <tr className="bg-blue-50">
                <td className="p-3">
                  <input type="datetime-local" value={editForm.time} onChange={e => setEditForm({...editForm, time: e.target.value})} className="border p-1 w-full rounded" />
                </td>
                <td className="p-3">
                  <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="border p-1 w-20 rounded" />
                </td>
                <td className="p-3">
                  <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="border p-1 rounded">
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="changed">Changed</option>
                    <option value="archived">Archived</option>
                  </select>
                </td>
                <td className="p-3 flex justify-end gap-2">
                  <button onClick={handleCreate} className="text-green-600"><CheckCircle size={18} /></button>
                  <button onClick={() => setEditingId(null)} className="text-gray-500"><XCircle size={18} /></button>
                </td>
              </tr>
            )}

            {filteredRecords.length === 0 && editingId !== 'new' && (
              <tr><td colSpan="4" className="p-6 text-center text-gray-500">No events found. Adjust filters or create a new one.</td></tr>
            )}

            {filteredRecords.map(record => (
              editingId === record.id ? (
                <tr key={record.id} className="bg-blue-50">
                  <td className="p-3">
                    <input type="datetime-local" value={editForm.time} onChange={e => setEditForm({...editForm, time: e.target.value})} className="border p-1 w-full rounded" />
                  </td>
                  <td className="p-3">
                    <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="border p-1 w-20 rounded" />
                  </td>
                  <td className="p-3">
                    <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="border p-1 rounded">
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="changed">Changed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                  <td className="p-3 flex justify-end gap-2">
                    <button onClick={() => handleSave(record.id)} className="text-green-600"><CheckCircle size={18} /></button>
                    <button onClick={() => setEditingId(null)} className="text-gray-500"><XCircle size={18} /></button>
                  </td>
                </tr>
              ) : (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="p-3 whitespace-nowrap">{format(new Date(record.time), 'MMM d, HH:mm')}</td>
                  <td className="p-3">{record.amount} ml</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium
                      ${record.status === 'draft' ? 'bg-gray-200 text-gray-700' :
                        record.status === 'ready' ? 'bg-green-100 text-green-700' :
                        record.status === 'changed' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="p-3 flex justify-end gap-2">
                    <button onClick={() => handleEdit(record)} className="text-blue-600 hover:text-blue-800"><Edit2 size={16} /></button>
                    <button onClick={() => deleteRecord(record.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
