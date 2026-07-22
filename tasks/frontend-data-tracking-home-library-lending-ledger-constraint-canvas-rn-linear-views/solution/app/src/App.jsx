import React, { useState, useEffect, useCallback } from 'react';
import Canvas from './Canvas.jsx';
import { Download, Upload, Undo2, Plus, Trash2, Edit2, Check, X, Search } from 'lucide-react';

const SCHEMA_VERSION = 'v1';

export const STATUSES = {
  DRAFT: 'draft',
  READY: 'ready',
  CHANGED: 'changed',
  ARCHIVED: 'archived',
};

export const INITIAL_DATA = [
  { id: '1', title: 'The Dispossessed', author: 'Ursula K. Le Guin', status: STATUSES.READY, constraintLane: 'available' },
  { id: '2', title: 'Dune', author: 'Frank Herbert', status: STATUSES.CHANGED, constraintLane: 'borrowed' },
  { id: '3', title: 'Foundation', author: 'Isaac Asimov', status: STATUSES.DRAFT, constraintLane: 'conflict' },
  { id: '4', title: 'Neuromancer', author: 'William Gibson', status: STATUSES.ARCHIVED, constraintLane: 'available' },
];

let globalSetAppState = null;
let globalGetAppState = null;

export const dispatchUpdate = (action, payload) => {
  if (globalSetAppState && globalGetAppState) {
    const prevState = globalGetAppState();
    const nextState = applyAction(prevState, action, payload);
    if (nextState !== prevState) {
      globalSetAppState(nextState);
    }
  }
};

const applyAction = (state, action, payload) => {
  const addToHistory = (newState) => {
    return {
      ...newState,
      history: [...state.history, state.records],
    };
  };

  switch (action) {
    case 'UPDATE_RECORD_LANE': {
      const { id, constraintLane, status } = payload;
      const newRecords = state.records.map((r) =>
        r.id === id ? { ...r, constraintLane, status: status || r.status } : r
      );
      return addToHistory({ ...state, records: newRecords });
    }
    case 'CREATE_RECORD': {
      const newRecords = [...state.records, { ...payload.record, id: String(Date.now()) }];
      return addToHistory({ ...state, records: newRecords });
    }
    case 'UPDATE_RECORD': {
      const newRecords = state.records.map(r => r.id === payload.id ? { ...r, ...payload.data } : r);
      return addToHistory({ ...state, records: newRecords });
    }
    case 'DELETE_RECORD': {
      const newRecords = state.records.filter(r => r.id !== payload.id);
      return addToHistory({ ...state, records: newRecords });
    }
    case 'UNDO': {
      if (state.history.length === 0) return state;
      const prevRecords = state.history[state.history.length - 1];
      return {
        ...state,
        records: prevRecords,
        history: state.history.slice(0, -1),
      };
    }
    case 'IMPORT': {
      return {
        ...state,
        records: payload.records,
        history: [], // clear history on import
      };
    }
    default:
      return state;
  }
};


export default function App() {
  const [state, setState] = useState({
    records: INITIAL_DATA,
    history: [],
  });

  const [filterMode, setFilterMode] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    globalSetAppState = setState;
    globalGetAppState = () => state;
    // For WebMCP bridging
    window.__APP_STATE__ = {
      getState: () => state,
      dispatch: (action, payload) => dispatchUpdate(action, payload)
    };
    return () => {
      globalSetAppState = null;
      globalGetAppState = null;
      delete window.__APP_STATE__;
    };
  }, [state]);

  const handleExport = () => {
    const payload = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: {
        summary: {
          total: state.records.length,
          available: state.records.filter(r => r.constraintLane === 'available').length,
          borrowed: state.records.filter(r => r.constraintLane === 'borrowed').length,
          conflict: state.records.filter(r => r.constraintLane === 'conflict').length,
        }
      },
      history: state.history
    };

    // Create and trigger download
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library-lending-v1-constraint-canvas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.schemaVersion !== SCHEMA_VERSION) {
          setErrorMsg('Invalid schema version');
          return;
        }
        if (!Array.isArray(data.records)) {
          setErrorMsg('Invalid records format');
          return;
        }

        // Basic validation
        const validRecords = data.records.every(r => r.id && r.title && r.status && r.constraintLane);
        if (!validRecords) {
          setErrorMsg('Records missing required fields');
          return;
        }

        dispatchUpdate('IMPORT', { records: data.records });
        setErrorMsg('');
      } catch (err) {
        setErrorMsg('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const filteredRecords = state.records.filter(r => {
    if (filterMode === 'all') return true;
    return r.status === filterMode;
  });

  const handleCreate = () => {
    const newRecord = {
      title: 'New Book',
      author: 'Unknown',
      status: STATUSES.DRAFT,
      constraintLane: 'available'
    };
    dispatchUpdate('CREATE_RECORD', { record: newRecord });
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditForm({ ...record });
  };

  const saveEdit = () => {
    if (!editForm.title.trim()) {
      setErrorMsg('Title is required');
      return;
    }
    dispatchUpdate('UPDATE_RECORD', { id: editingId, data: editForm });
    setEditingId(null);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">Home Library Lending Ledger</h1>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => dispatchUpdate('UNDO')}
            disabled={state.history.length === 0}
            className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1 text-sm"
            aria-label="Undo last action"
          >
            <Undo2 size={16} /> Undo
          </button>
          <button
            onClick={handleExport}
            className="p-2 border rounded hover:bg-gray-50 flex items-center gap-1 text-sm bg-blue-50 text-blue-700 border-blue-200"
            aria-label="Export session"
          >
            <Download size={16} /> Export
          </button>
          <label className="p-2 border rounded hover:bg-gray-50 flex items-center gap-1 text-sm cursor-pointer bg-green-50 text-green-700 border-green-200">
            <Upload size={16} /> Import
            <input type="file" accept=".json" className="hidden" onChange={handleImport} data-testid="import-input" />
          </label>
        </div>
      </header>

      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4" role="alert">
          <span className="block sm:inline">{errorMsg}</span>
          <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setErrorMsg('')}>
            <X size={16} />
          </button>
        </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
        {/* Left pane: Collection */}
        <section className="md:w-1/3 flex flex-col bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-3 border-b flex justify-between items-center bg-gray-50">
            <h2 className="font-semibold flex items-center gap-2"><Search size={16}/> Collection</h2>
            <button onClick={handleCreate} className="p-1 hover:bg-gray-200 rounded text-gray-600" aria-label="Add book"><Plus size={18}/></button>
          </div>
          <div className="p-2 border-b flex gap-2 overflow-x-auto text-sm">
            <button onClick={() => setFilterMode('all')} className={`px-2 py-1 rounded ${filterMode === 'all' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>All</button>
            {Object.values(STATUSES).map(s => (
              <button key={s} onClick={() => setFilterMode(s)} className={`px-2 py-1 rounded capitalize ${filterMode === s ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredRecords.length === 0 ? (
              <div className="text-gray-500 text-center py-4 text-sm">No books found.</div>
            ) : (
              filteredRecords.map(record => (
                <div key={record.id} className="border rounded p-2 flex flex-col gap-2 hover:border-blue-300 transition-colors">
                  {editingId === record.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        value={editForm.title}
                        onChange={e => setEditForm({...editForm, title: e.target.value})}
                        className="border px-2 py-1 text-sm rounded"
                        placeholder="Title"
                      />
                      <input
                        value={editForm.author}
                        onChange={e => setEditForm({...editForm, author: e.target.value})}
                        className="border px-2 py-1 text-sm rounded"
                        placeholder="Author"
                      />
                      <select
                        value={editForm.status}
                        onChange={e => setEditForm({...editForm, status: e.target.value})}
                        className="border px-2 py-1 text-sm rounded"
                      >
                        {Object.values(STATUSES).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div className="flex gap-1 justify-end">
                        <button onClick={saveEdit} className="p-1 bg-blue-500 text-white rounded"><Check size={14}/></button>
                        <button onClick={() => setEditingId(null)} className="p-1 bg-gray-200 rounded"><X size={14}/></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-800">{record.title}</div>
                          <div className="text-xs text-gray-500">{record.author}</div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(record)} className="text-gray-400 hover:text-blue-500" aria-label={`Edit ${record.title}`}><Edit2 size={14}/></button>
                          <button onClick={() => { if(window.confirm('Delete this record?')) dispatchUpdate('DELETE_RECORD', {id: record.id}) }} className="text-gray-400 hover:text-red-500" aria-label={`Delete ${record.title}`}><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 capitalize">{record.status}</span>
                        <span className="text-gray-400">Lane: {record.constraintLane}</span>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right pane: Constraint Canvas */}
        <section className="md:w-2/3 bg-white rounded shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-gray-50">
            <h2 className="font-semibold">Constraint Canvas</h2>
          </div>
          <div className="flex-1 p-4 bg-slate-50 overflow-auto">
             <Canvas records={state.records} onMove={(id, lane, status) => dispatchUpdate('UPDATE_RECORD_LANE', {id, constraintLane: lane, status})} />
          </div>
          <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex gap-4">
             <div>Total: {state.records.length}</div>
             <div>Available: {state.records.filter(r => r.constraintLane === 'available').length}</div>
             <div>Borrowed: {state.records.filter(r => r.constraintLane === 'borrowed').length}</div>
             <div>Conflict: {state.records.filter(r => r.constraintLane === 'conflict').length}</div>
          </div>
        </section>
      </main>
    </div>
  );
}
