import React, { useState, useEffect, useRef } from 'react';
import { create } from 'zustand';

// Store
export const useStore = create((set, get) => ({
  records: [
    { id: '1', name: 'Boundary Low', status: 'draft', glaze: 'Clear', capacity: 0 },
    { id: '2', name: 'Boundary High', status: 'ready', glaze: 'Celadon', capacity: 100 },
    { id: '3', name: 'Valid Item', status: 'changed', glaze: 'Tenmoku', capacity: 50 },
  ],
  derived: { totalCapacity: 150 },
  history: [],
  selectedRecordId: null,
  filterStatus: 'all',

  selectRecord: (id) => set({ selectedRecordId: id }),
  setFilterStatus: (status) => set({ filterStatus: status }),

  addRecord: (record) => set((state) => {
    const newRecords = [...state.records, { ...record, id: Date.now().toString() }];
    const totalCapacity = newRecords.reduce((sum, r) => sum + r.capacity, 0);
    return { records: newRecords, derived: { totalCapacity } };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    const totalCapacity = newRecords.reduce((sum, r) => sum + r.capacity, 0);
    return { records: newRecords, derived: { totalCapacity }, selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates, status: 'changed' } : r);
    const totalCapacity = newRecords.reduce((sum, r) => sum + r.capacity, 0);
    return { records: newRecords, derived: { totalCapacity } };
  }),

  archiveRecord: (id) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, status: 'archived' } : r);
    return { records: newRecords };
  }),

  mutateCapacity: (id, newCapacity) => set((state) => {
    if (newCapacity < 0 || newCapacity > 100) return state;

    const record = state.records.find(r => r.id === id);
    if (!record) return state;

    const oldCapacity = record.capacity;
    const oldStatus = record.status;

    if (oldCapacity === newCapacity) return state;

    const newRecords = state.records.map(r =>
      r.id === id ? { ...r, capacity: newCapacity, status: 'changed' } : r
    );

    const totalCapacity = newRecords.reduce((sum, r) => sum + r.capacity, 0);

    return {
      records: newRecords,
      derived: { totalCapacity },
      history: [...state.history, { id, oldCapacity, oldStatus, newCapacity, newStatus: 'changed' }]
    };
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;

    const lastAction = state.history[state.history.length - 1];
    const newRecords = state.records.map(r =>
      r.id === lastAction.id ? { ...r, capacity: lastAction.oldCapacity, status: lastAction.oldStatus } : r
    );

    const totalCapacity = newRecords.reduce((sum, r) => sum + r.capacity, 0);

    return {
      records: newRecords,
      derived: { totalCapacity },
      history: state.history.slice(0, -1)
    };
  }),

  exportArtifact: () => {
    const state = get();
    const artifact = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history
    };

    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'glaze-atlas-v1.json';
    document.body.appendChild(a);
    a.click();
    // setTimeout to prevent race conditions during testing
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  },

  importArtifact: (artifactStr) => set((state) => {
    try {
      const artifact = typeof artifactStr === 'string' ? JSON.parse(artifactStr) : artifactStr;
      if (artifact.schemaVersion !== 'v1') return state;
      // Simplistic validation
      if (!Array.isArray(artifact.records)) return state;

      const newExportedAt = new Date().toISOString();
      return {
        records: artifact.records,
        derived: artifact.derived || { totalCapacity: 0 },
        history: artifact.history || [],
        selectedRecordId: null,
        exportedAt: newExportedAt // regenerated timestamp
      };
    } catch (e) {
      return state;
    }
  }),

  clearSession: () => set({
    records: [],
    derived: { totalCapacity: 0 },
    history: [],
    selectedRecordId: null
  })
}));

function CreateForm({ onAdd }) {
  const [name, setName] = useState('');
  const [glaze, setGlaze] = useState('');
  const [capacity, setCapacity] = useState(0);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    if (!glaze.trim()) { setError('Glaze is required'); return; }
    if (capacity < 0 || capacity > 100) { setError('Capacity must be 0-100'); return; }
    onAdd({ name, glaze, capacity, status: 'draft' });
    setName(''); setGlaze(''); setCapacity(0); setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
      <h3 className="font-semibold mb-2">Add New Record</h3>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <div className="flex flex-wrap gap-2 items-center">
        <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="border p-2 rounded" />
        <input type="text" placeholder="Glaze" value={glaze} onChange={e => setGlaze(e.target.value)} className="border p-2 rounded" />
        <input type="number" min="0" max="100" value={capacity} onChange={e => setCapacity(parseInt(e.target.value) || 0)} className="border p-2 rounded w-24" />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Add</button>
      </div>
    </form>
  );
}

export default function App() {
  const { records, derived, history, selectedRecordId, filterStatus, selectRecord, mutateCapacity, setFilterStatus, addRecord, updateRecord, deleteRecord, archiveRecord, undo, exportArtifact, importArtifact, clearSession } = useStore();

  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      importArtifact(event.target.result);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const filteredRecords = records.filter(r => filterStatus === 'all' || r.status === filterStatus);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Primary Surface */}
      <div className="flex-1 p-6 flex flex-col">
        <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Ceramic Glaze Test Atlas</h1>
          <div className="flex gap-2">
            <button onClick={undo} disabled={history.length === 0} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300">Undo</button>
            <button onClick={clearSession} className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200">Clear</button>
            <label className="px-4 py-2 bg-gray-200 rounded cursor-pointer hover:bg-gray-300">
              Import
              <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            </label>
            <button onClick={exportArtifact} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Export</button>
          </div>
        </header>

        <CreateForm onAdd={addRecord} />

        <div className="flex-1 bg-white rounded-lg shadow border border-gray-200 p-6 overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Spatial Composer</h2>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border p-2 rounded">
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="text-gray-500 text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
              No records. Add one, import an artifact, or use WebMCP to seed.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecords.map(record => (
                <div
                  key={record.id}
                  data-testid={`record-${record.name.replace(/\s+/g, '-')}`}
                  onClick={() => selectRecord(record.id)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectRecord(record.id); } }}
                  className={`p-4 rounded border transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 relative group ${
                    selectedRecordId === record.id ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-800">{record.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      record.status === 'changed' ? 'bg-amber-100 text-amber-800' :
                      record.status === 'ready' ? 'bg-green-100 text-green-800' :
                      record.status === 'archived' ? 'bg-gray-300 text-gray-600' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Glaze: {record.glaze}</p>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium w-16">Capacity</span>
                    <input
                      type="range"
                      min="0" max="100"
                      value={record.capacity}
                      onChange={(e) => mutateCapacity(record.id, parseInt(e.target.value))}
                      className="flex-1 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm w-8 text-right font-mono">{record.capacity}</span>
                  </div>

                  {/* Actions inside card */}
                  <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); archiveRecord(record.id); }} className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">Archive</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail / Summary Panel */}
      <div className="w-full md:w-80 bg-white border-l border-gray-200 p-6 flex flex-col gap-6 overflow-y-auto">
        <div>
          <h2 className="text-lg font-semibold mb-2 text-gray-800">Linked Summary</h2>
          <div aria-live="polite" className="bg-gray-50 p-4 rounded border border-gray-200 transition-colors">
            <p className="text-sm text-gray-600">Total Capacity</p>
            <p className="text-3xl font-bold text-gray-900">{derived.totalCapacity}</p>
          </div>
        </div>

        {selectedRecordId ? (
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Detail Inspector</h2>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 flex flex-col gap-3">
              {records.filter(r => r.id === selectedRecordId).map(record => (
                <React.Fragment key={record.id}>
                  <div><span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Name</span><br/><span className="text-gray-900">{record.name}</span></div>
                  <div><span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Status</span><br/><span className="text-gray-900">{record.status}</span></div>
                  <div><span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Glaze</span><br/><span className="text-gray-900">{record.glaze}</span></div>
                  <div><span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Capacity</span><br/><span className="text-gray-900 font-mono">{record.capacity}</span></div>
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-sm mt-4 italic">
            Select a record in the spatial composer to view details.
          </div>
        )}
      </div>
    </div>
  );
}
