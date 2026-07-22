import React, { useRef, useState } from 'react';
import { useStations } from '../context/StationsContext';
import { validateArtifact, exportArtifact } from '../utils/artifact';
import { Download, Upload, Trash2, Undo2, AlertCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const { state, dispatch } = useStations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = () => {
    exportArtifact(state);
    setErrorMsg(null);
  };

  const handleClear = () => {
    dispatch({ type: 'CLEAR_SESSION' });
    setErrorMsg(null);
  };

  const handleUndo = () => {
    dispatch({ type: 'UNDO' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (validateArtifact(json)) {
          // Regenerate exportedAt to reflect import moment
          const restoredState = {
            ...json,
            exportedAt: new Date().toISOString()
          };
          dispatch({ type: 'RESTORE_SESSION', payload: restoredState });
          setErrorMsg(null);
        } else {
          setErrorMsg('Invalid or malformed artifact file.');
        }
      } catch (err) {
        setErrorMsg('Failed to parse JSON file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Classroom Rotation Scheduler</h1>
        {errorMsg && (
          <div className="flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errorMsg}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={handleUndo}
          disabled={state.history.length === 0}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Undo2 className="w-4 h-4 mr-1.5" />
          Undo
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2"></div>

        <button
          onClick={handleClear}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Clear
        </button>

        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
        >
          <Upload className="w-4 h-4 mr-1.5" />
          Import
        </button>

        <button
          onClick={handleExport}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-gray-900 border border-transparent rounded hover:bg-gray-800"
        >
          <Download className="w-4 h-4 mr-1.5" />
          Export
        </button>
      </div>
    </header>
  );
};
