import { useEffect, useReducer, useRef, useState } from 'react';
import { appReducer, initialState, computeDerivedState } from './store';
import { Ribbon } from './components/Ribbon';
import { List } from './components/List';
import type { ConferenceSpeakerGreenroomBoardSession, AppAction, RecordStatus } from './types';

declare global {
  interface Window {
    __dispatch?: React.Dispatch<AppAction>;
    __getState?: () => import('./types').AppState;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const derived = computeDerivedState(state.records);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<RecordStatus | 'all'>('all');

  useEffect(() => {
    window.__dispatch = dispatch;
    window.__getState = () => state;
    return () => {
      delete window.__dispatch;
      delete window.__getState;
    };
  }, [state]);

  const handleExport = () => {
    const payload: ConferenceSpeakerGreenroomBoardSession = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived,
      history: state.history,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'speaker-greenroom-v1.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text) as ConferenceSpeakerGreenroomBoardSession;

        if (data.schemaVersion !== 'v1') throw new Error("Invalid schemaVersion, expected 'v1'");
        if (!Array.isArray(data.records)) throw new Error("Invalid records array");

        const validStatuses = ['empty', 'draft', 'ready', 'changed', 'archived'];
        const seenIds = new Set<string>();

        data.records.forEach((r, idx) => {
          if (!r.id || typeof r.id !== 'string') throw new Error(`Record at index ${idx} missing id`);
          if (seenIds.has(r.id)) throw new Error(`Duplicate id: ${r.id}`);
          seenIds.add(r.id);
          if (!validStatuses.includes(r.status)) throw new Error(`Invalid status '${r.status}' on record ${r.id}`);
          if (typeof r.forecastScore !== 'number' || r.forecastScore < 0 || r.forecastScore > 100) {
            throw new Error(`Invalid forecastScore on record ${r.id}, must be between 0 and 100`);
          }
        });

        dispatch({ type: 'SET_RECORDS', payload: { records: data.records, history: data.history || [] } });
        setErrorMsg(null);
      } catch (err: any) {
        setErrorMsg(`Import failed: ${err.message}. Please correct the value and try again.`);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    dispatch({ type: 'SET_RECORDS', payload: { records: [], history: [] } });
    setErrorMsg(null);
  };

  const handleCreate = () => {
    const newRecord = {
      id: crypto.randomUUID(),
      status: 'draft' as RecordStatus,
      title: 'New Speaker Slot',
      speaker: '',
      time: 'TBD',
      forecastScore: 50,
    };
    dispatch({ type: 'CREATE_RECORD', payload: newRecord });
    dispatch({ type: 'SELECT_RECORD', payload: newRecord.id });
  };

  const handleDelete = () => {
    if (state.selectedRecordId) {
      if (window.confirm("Are you sure you want to delete this record?")) {
        dispatch({ type: 'DELETE_RECORD', payload: state.selectedRecordId });
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedRecord = state.records.find(r => r.id === state.selectedRecordId) || null;

  const filteredRecords = filterStatus === 'all'
    ? state.records
    : state.records.filter(r => r.status === filterStatus);

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap justify-between items-center shadow-sm gap-2">
        <h1 className="text-xl font-bold">Conference Speaker Greenroom Board</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 mr-4">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border border-gray-300 rounded p-1 text-sm bg-white"
            >
              <option value="all">All</option>
              <option value="empty">Empty</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <button onClick={handleCreate} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors">
            Create
          </button>

          <button
            onClick={handleDelete}
            disabled={!state.selectedRecordId}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded text-sm font-medium transition-colors"
          >
            Delete Selected
          </button>

          <button onClick={handleExport} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors">
            Export
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm font-medium transition-colors">
            Import
          </button>
          <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
          <button onClick={handleClear} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm font-medium transition-colors">
            Clear All
          </button>
        </div>
      </header>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3 border-b border-red-200 text-sm">
          {errorMsg}
        </div>
      )}

      <Ribbon
        selectedRecord={selectedRecord}
        onUpdate={(record) => dispatch({ type: 'UPDATE_RECORD', payload: record })}
        onUndo={() => dispatch({ type: 'UNDO' })}
        canUndo={state.undoStack.length > 0}
      />

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <List
          records={filteredRecords}
          selectedId={state.selectedRecordId}
          onSelect={(id) => dispatch({ type: 'SELECT_RECORD', payload: id })}
        />

        <aside className="w-full md:w-64 bg-white border-t md:border-t-0 md:border-l border-gray-200 p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4 text-gray-800">Derived Summary</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-700">Total Records</p>
              <p className="text-2xl font-light text-gray-900">{derived.totalRecords}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Avg Forecast Score</p>
              <p className="text-2xl font-light text-gray-900">{derived.averageScore.toFixed(1)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-2">Status Distribution</p>
              <ul className="space-y-1">
                {Object.entries(derived.statusCounts).map(([status, count]) => (
                  <li key={status} className="flex justify-between">
                    <span className="capitalize">{status}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
