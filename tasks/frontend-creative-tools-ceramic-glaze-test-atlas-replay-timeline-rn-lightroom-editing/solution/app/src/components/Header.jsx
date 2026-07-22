import React, { useState } from 'react';
import { useStore } from '../store';
import { Undo, Download, Upload, Trash2 } from 'lucide-react';
import { SessionSchema } from '../schema';

export default function Header() {
  const { state, dispatch, derived } = useStore();
  const [errorMsg, setErrorMsg] = useState("");

  const handleUndo = () => {
    dispatch({ type: 'UNDO' });
  };

  const handleExport = () => {
    const session = {
      schemaVersion: "v1",
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived,
      history: []
    };
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'glaze-atlas-v1-replay-timeline.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const parsed = SessionSchema.parse(json);
        dispatch({ type: 'SET_STATE', payload: { records: parsed.records, selectedId: null, undoStack: [] } });
        setErrorMsg("");
      } catch (err) {
        setErrorMsg("Malformed import data.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleClear = () => {
    dispatch({ type: 'SET_STATE', payload: { records: [], selectedId: null, undoStack: [] } });
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-amber-600 rounded flex items-center justify-center text-white font-bold">C</div>
        <h1 className="font-semibold text-lg">Ceramic Glaze Test Atlas</h1>
      </div>

      <div className="flex items-center gap-3">
        <div aria-live="polite" className="text-red-500 text-sm mr-4">{errorMsg}</div>
        <button
          onClick={handleUndo}
          disabled={state.undoStack.length === 0}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-50"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={18} />
        </button>
        <button onClick={handleClear} className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded">
          <Trash2 size={16} /> Clear Session
        </button>
        <label className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 rounded cursor-pointer">
          <Upload size={16} /> Import JSON
          <input type="file" accept=".json" className="hidden" onChange={handleImport} />
        </label>
        <button onClick={handleExport} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 rounded">
          <Download size={16} /> Export JSON
        </button>
      </div>
    </header>
  );
}
