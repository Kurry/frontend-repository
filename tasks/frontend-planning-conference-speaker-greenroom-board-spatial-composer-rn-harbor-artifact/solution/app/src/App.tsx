import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { SpeakerSlotRecord } from './types';
import SpatialComposer from './SpatialComposer';
import { Download, Upload, Undo2, Plus, Trash2 } from 'lucide-react';
import { initWebMCP } from './webmcp';

export default function App() {
  const { state, dispatch, undo } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initWebMCP();
  }, []);

  const handleExport = () => {
    const data = {
      ...state,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'speaker-greenroom-v1-spatial-composer.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.schemaVersion !== 'v1') throw new Error('Invalid schema version');
        if (!Array.isArray(json.records)) throw new Error('Invalid records');

        dispatch({ type: 'CLEAR' });
        dispatch({
          type: 'IMPORT',
          payload: {
            ...json,
            exportedAt: new Date().toISOString()
          }
        });
        setError(null);
      } catch (err) {
        setError('Malformed import: ' + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
  };

  const activeRecord = selectedId ? state.records.find(r => r.id === selectedId) : null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans" onKeyDown={handleKeyDown} tabIndex={0}>
      <header className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <h1 className="text-xl font-semibold">Greenroom Spatial Composer</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
            Total Capacity: <span className="font-medium" data-testid="total-capacity">{state.derived.summary.totalCapacity}</span> |
            Ready: <span className="font-medium" data-testid="ready-count">{state.derived.summary.readyCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={undo} className="p-2 text-slate-600 hover:bg-slate-100 rounded" title="Undo (Cmd+Z)">
              <Undo2 size={18} />
            </button>
            <button onClick={() => dispatch({ type: 'CLEAR' })} className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100">
              Clear
            </button>
            <label className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 cursor-pointer flex items-center gap-2">
              <Upload size={16} /> Import
              <input type="file" className="hidden" accept=".json" onChange={handleImport} data-testid="import-input" />
            </label>
            <button onClick={handleExport} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2" data-testid="export-button">
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden md:flex-row flex-col">
        {/* Main Spatial Composer Area */}
        <div className="flex-1 relative overflow-hidden bg-slate-100">
          <SpatialComposer
            records={state.records}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMutate={(id, payload) => dispatch({ type: 'MUTATE_SPATIAL', id, payload })}
          />
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 bg-white border-l border-slate-200 flex flex-col z-10 shadow-lg md:shadow-none">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-semibold">Speaker Slots</h2>
            <button
              onClick={() => {
                const newId = `speaker-${Date.now()}`;
                const newRecord: SpeakerSlotRecord = {
                  id: newId,
                  speakerName: 'New Speaker',
                  topic: 'New Topic',
                  duration: 30,
                  status: 'empty',
                  spatialComposerState: { x: 10, y: 10, capacity: 50 }
                };
                dispatch({ type: 'CREATE_RECORD', payload: newRecord });
                setSelectedId(newId);
              }}
              className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
              title="Add Speaker"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeRecord ? (
              <Editor
                record={activeRecord}
                onSave={(record) => {
                  dispatch({ type: 'UPDATE_RECORD', payload: record });
                }}
                onDelete={() => {
                  dispatch({ type: 'DELETE_RECORD', id: activeRecord.id });
                  setSelectedId(null);
                }}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <div className="space-y-2">
                {state.records.slice(0, 50).map(r => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`p-3 border rounded cursor-pointer transition-colors ${selectedId === r.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="font-medium">{r.speakerName}</div>
                    <div className="text-sm text-slate-500 truncate">{r.topic}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.status === 'ready' ? 'bg-green-100 text-green-800' :
                        r.status === 'changed' ? 'bg-yellow-100 text-yellow-800' :
                        r.status === 'draft' ? 'bg-slate-100 text-slate-800' :
                        r.status === 'archived' ? 'bg-slate-200 text-slate-500' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {r.status}
                      </span>
                      <span className="text-xs text-slate-400">Cap: {r.spatialComposerState.capacity}</span>
                    </div>
                  </div>
                ))}
                {state.records.length > 50 && (
                  <div className="text-sm text-slate-500 text-center py-2">+ {state.records.length - 50} more</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Editor({ record, onSave, onDelete, onClose }: { record: SpeakerSlotRecord, onSave: (r: SpeakerSlotRecord) => void, onDelete: () => void, onClose: () => void }) {
  const [draft, setDraft] = useState(record);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(record);
    setError(null);
  }, [record]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue: any = value;

    if (name === 'duration') {
      finalValue = parseInt(value, 10);
      if (isNaN(finalValue)) finalValue = 0;
    }

    setDraft(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = () => {
    if (draft.duration < 5 || draft.duration > 180) {
      setError("Invalid duration: must be between 5 and 180");
      return;
    }
    setError(null);
    onSave(draft);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">&larr; Back</button>
        <button onClick={onDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
          <Trash2 size={16} />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Speaker Name</label>
        <input type="text" name="speakerName" value={draft.speakerName} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
        <input type="text" name="topic" value={draft.topic} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Duration (mins)</label>
        <input type="number" name="duration" value={draft.duration} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
        {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
        <select name="status" value={draft.status} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <button onClick={handleSave} className="w-full py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}
