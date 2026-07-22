import React, { useState } from 'react';
import { useAppStore } from '../state';
import type { CheckpointStatus } from '../state';

export const Collection: React.FC = () => {
  const { records, addRecord, updateRecord, deleteRecord, selectRecord, composer } = useAppStore();
  const [filter, setFilter] = useState<CheckpointStatus | 'all'>('all');

  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [newStatus, setNewStatus] = useState<CheckpointStatus>('draft');
  const [errorMsg, setErrorMsg] = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editStatus, setEditStatus] = useState<CheckpointStatus>('draft');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const capacityNum = parseInt(newCapacity, 10);
    if (!newName.trim()) {
      setErrorMsg('Name is required');
      return;
    }
    if (isNaN(capacityNum) || capacityNum < 1 || capacityNum > 1000) {
      setErrorMsg('Capacity must be between 1 and 1000');
      return;
    }
    setErrorMsg('');
    addRecord({ name: newName.trim(), capacity: capacityNum, status: newStatus });
    setNewName('');
    setNewCapacity('');
    setNewStatus('draft');
  };

  const handleEditSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const capacityNum = parseInt(editCapacity, 10);
    if (!editName.trim()) {
      setErrorMsg('Name is required');
      return;
    }
    if (isNaN(capacityNum) || capacityNum < 1 || capacityNum > 1000) {
      setErrorMsg('Capacity must be between 1 and 1000');
      return;
    }
    setErrorMsg('');
    updateRecord(id, { name: editName.trim(), capacity: capacityNum, status: editStatus });
    setEditId(null);
  };

  const startEdit = (id: string) => {
    const record = records.find(r => r.id === id);
    if (record) {
      setEditId(id);
      setEditName(record.name);
      setEditCapacity(record.capacity.toString());
      setEditStatus(record.status);
      setErrorMsg('');
    }
  };

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  return (
    <div className="bg-white p-4 shadow rounded flex-1">
      <h2 className="text-xl font-bold mb-4">Drill Checkpoints</h2>

      <div className="mb-4">
        <label className="font-semibold mr-2">Filter by Status:</label>
        <select
          className="border rounded p-1"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="all">All</option>
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {errorMsg && <div className="text-red-500 mb-2 font-semibold" role="alert">{errorMsg}</div>}

      <form onSubmit={handleAdd} className="flex gap-2 mb-4 items-end flex-wrap">
        <div>
          <label className="block text-sm">Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border rounded p-1 w-full"
            placeholder="Name"
          />
        </div>
        <div>
          <label className="block text-sm">Capacity (1-1000)</label>
          <input
            type="number"
            value={newCapacity}
            onChange={(e) => setNewCapacity(e.target.value)}
            className="border rounded p-1 w-24"
            placeholder="100"
          />
        </div>
        <div>
          <label className="block text-sm">Status</label>
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as any)} className="border rounded p-1">
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded h-[34px] hover:bg-blue-700 transition-colors">Add</button>
      </form>

      {filteredRecords.length === 0 ? (
        <div className="text-gray-500 italic">No records found. Create one above.</div>
      ) : (
        <ul className="space-y-2">
          {filteredRecords.map(record => (
            <li
              key={record.id}
              className={`p-2 border rounded flex flex-col sm:flex-row sm:items-center justify-between transition-colors ${composer.selectedRecordId === record.id ? 'bg-blue-50 border-blue-400' : ''}`}
            >
              {editId === record.id ? (
                <form onSubmit={(e) => handleEditSubmit(e, record.id)} className="flex gap-2 flex-wrap flex-1">
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="border rounded p-1 w-32" />
                  <input type="number" value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)} className="border rounded p-1 w-20" />
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="border rounded p-1">
                    <option value="empty">Empty</option>
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="changed">Changed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button type="submit" className="text-green-600 font-semibold px-2">Save</button>
                  <button type="button" onClick={() => setEditId(null)} className="text-gray-500 px-2">Cancel</button>
                </form>
              ) : (
                <>
                  <div className="flex-1 cursor-pointer" onClick={() => selectRecord(record.id)}>
                    <div className="font-semibold">{record.name} <span className="text-xs text-gray-500 font-normal">#{record.id}</span></div>
                    <div className="text-sm">Capacity: {record.capacity} | Status: <span className="uppercase text-xs bg-gray-200 px-1 rounded">{record.status}</span></div>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <button onClick={() => startEdit(record.id)} className="text-blue-600 text-sm">Edit</button>
                    <button onClick={() => deleteRecord(record.id)} className="text-red-600 text-sm">Archive</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
