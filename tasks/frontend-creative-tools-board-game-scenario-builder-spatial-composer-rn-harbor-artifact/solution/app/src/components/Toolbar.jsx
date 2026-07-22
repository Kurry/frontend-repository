import React, { useRef } from 'react';
import { useStore, SessionSchema } from '../store';
import { Undo2, Download, Upload, Trash2 } from 'lucide-react';

export function Toolbar() {
  const { undo, historyIndex, getDerivedState, records, history, clearSession, importSession } = useStore();
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const derived = getDerivedState();
    const sessionData = {
      schemaVersion: 'scenario-builder-v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history
    };

    // validate before export
    try {
       SessionSchema.parse(sessionData);
    } catch(e) {
       console.error("Export validation failed", e);
       alert("Export validation failed. Check console.");
       return;
    }

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenario-builder-v1-spatial-composer.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const success = importSession(data);
        if (!success) {
          alert('Invalid session file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
      e.target.value = null; // reset
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-gray-800 text-white p-2 flex justify-between items-center shrink-0">
      <div className="flex gap-2">
        <button
          onClick={undo}
          disabled={historyIndex < 0}
          className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${historyIndex < 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} /> Undo
        </button>
      </div>
      <div className="flex gap-2 items-center">
         <button
          onClick={clearSession}
          className="flex items-center gap-1 px-3 py-1 rounded text-sm hover:bg-gray-700 text-red-300 hover:text-red-100"
        >
          <Trash2 size={16} /> Clear
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white font-medium"
        >
          <Download size={16} /> Export JSON
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImport}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white font-medium"
        >
          <Upload size={16} /> Import
        </button>
      </div>
    </div>
  );
}
