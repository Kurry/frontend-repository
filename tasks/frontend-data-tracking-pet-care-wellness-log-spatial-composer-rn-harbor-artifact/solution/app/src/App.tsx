import React, { useState, useEffect, useRef } from 'react';
import { useStore, PetCareEvent, EventStatus, SessionData, getSessionData } from './store';

const App = () => {
  const store = useStore();
  const [filter, setFilter] = useState<EventStatus | 'all'>('all');

  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState<EventStatus>('draft');
  const [newCapacity, setNewCapacity] = useState('10');

  const [errorMsg, setErrorMsg] = useState('');

  const [importJson, setImportJson] = useState('');

  const handleAdd = () => {
    if (!newTitle.trim()) {
      setErrorMsg('Title cannot be empty');
      return;
    }
    const cap = parseInt(newCapacity);
    if (isNaN(cap) || cap < 0 || cap > 100) {
      setErrorMsg('Capacity must be between 0 and 100');
      return;
    }
    setErrorMsg('');
    store.addRecord({ title: newTitle, status: newStatus, capacity: cap });
    setNewTitle('');
  };

  const filteredRecords = store.records.filter(r => filter === 'all' || r.status === filter);

  const totalCapacity = store.records.reduce((acc, r) => acc + r.capacity, 0);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    // Bounds check
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
        setErrorMsg('Position out of bounds');
        return;
    }

    store.updateRecord(id, { position: { x, y } });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleExport = () => {
    const data = getSessionData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pet-wellness-v1-spatial-composer.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const data: SessionData = JSON.parse(importJson);
      store.importData(data);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Invalid import data format');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans flex flex-col md:flex-row gap-8">

      {/* Sidebar / Collection */}
      <div className="w-full md:w-1/3 bg-white shadow rounded-lg p-6 flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Pet Care Events</h1>

        <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Create Event</h2>
            <input className="border p-2 rounded" placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <select className="border p-2 rounded" value={newStatus} onChange={e => setNewStatus(e.target.value as EventStatus)}>
                <option value="empty">Empty</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
            </select>
            <input className="border p-2 rounded" type="number" placeholder="Capacity (0-100)" value={newCapacity} onChange={e => setNewCapacity(e.target.value)} />
            <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors" onClick={handleAdd}>Add Event</button>
            {errorMsg && <p className="text-red-500 text-sm" role="alert">{errorMsg}</p>}
        </div>

        <div>
            <h2 className="text-lg font-semibold mb-2">Filters</h2>
            <select className="border p-2 rounded w-full" value={filter} onChange={e => setFilter(e.target.value as any)}>
                <option value="all">All</option>
                <option value="empty">Empty</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
            </select>
        </div>

        <div className="flex-grow overflow-y-auto max-h-64 border rounded p-2">
            {filteredRecords.length === 0 ? (
                <p className="text-gray-500 text-sm">No events found.</p>
            ) : (
                filteredRecords.map(record => (
                    <div key={record.id}
                         draggable
                         onDragStart={(e) => handleDragStart(e, record.id)}
                         onClick={() => store.setSelectedRecordId(record.id)}
                         className={`p-3 mb-2 border rounded cursor-move transition-colors
                                    ${store.selectedRecordId === record.id ? 'border-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50'}`}>
                        <div className="font-medium">{record.title}</div>
                        <div className="text-xs text-gray-500">Status: {record.status} | Capacity: {record.capacity}</div>
                        <div className="text-xs text-gray-400 mt-1">Drag to composer</div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Spatial Composer */}
      <div className="w-full md:w-2/3 flex flex-col gap-6">

        <div className="bg-white shadow rounded-lg p-6 flex flex-col gap-4 flex-grow">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Spatial Composer</h2>
                <div className="flex gap-2">
                    <button
                        onClick={store.undo}
                        disabled={!store.canUndo}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50">
                        Undo
                    </button>
                </div>
            </div>

            <div
                className="flex-grow bg-slate-100 border-2 border-dashed border-slate-300 rounded relative overflow-hidden min-h-[400px]"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                data-testid="spatial-composer"
            >
                {store.records.filter(r => r.position).map(record => (
                    <div
                        key={record.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, record.id)}
                        onClick={(e) => { e.stopPropagation(); store.setSelectedRecordId(record.id); }}
                        className={`absolute p-2 rounded shadow text-sm cursor-move flex flex-col items-center justify-center transition-transform hover:scale-105
                            ${store.selectedRecordId === record.id ? 'ring-2 ring-blue-500 z-10' : 'z-0'}
                            ${record.status === 'archived' ? 'bg-gray-300' : 'bg-white'}`}
                        style={{ left: record.position!.x - 50, top: record.position!.y - 25, width: 100, height: 50 }}
                    >
                        <span className="font-semibold truncate w-full text-center">{record.title}</span>
                        <span className="text-xs">{record.capacity} cap</span>
                    </div>
                ))}
                {store.records.filter(r => r.position).length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 pointer-events-none">
                        Drag records here to rebalance capacity
                    </div>
                )}
            </div>
        </div>

        {/* Artifact / Summary */}
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Derived State & Artifact</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded text-center">
                    <div className="text-3xl font-bold text-blue-700">{totalCapacity}</div>
                    <div className="text-sm text-blue-600 font-medium">Total Capacity</div>
                </div>
                <div className="bg-green-50 p-4 rounded text-center">
                    <div className="text-3xl font-bold text-green-700">{store.records.filter(r => r.status !== 'archived').length}</div>
                    <div className="text-sm text-green-600 font-medium">Active Records</div>
                </div>
            </div>

            <div className="flex flex-col gap-4 border-t pt-4">
                <button onClick={handleExport} className="w-full bg-slate-800 text-white p-2 rounded hover:bg-slate-700">
                    Export Session (JSON)
                </button>

                <div className="flex flex-col gap-2">
                    <textarea
                        className="w-full border rounded p-2 text-xs font-mono"
                        rows={3}
                        placeholder="Paste JSON here to import"
                        value={importJson}
                        onChange={e => setImportJson(e.target.value)}
                    />
                    <button onClick={handleImport} className="w-full bg-slate-200 text-slate-800 p-2 rounded hover:bg-slate-300">
                        Import Session
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default App;
