import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { SessionArtifact } from '../types';
import { Download, Upload, FileJson } from 'lucide-react';

export const PortableArtifact: React.FC = () => {
  const { state, dispatch } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateArtifact = (): SessionArtifact => {
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: {
        totalCount: state.records.length,
        recoveryCount: state.records.filter(r => r.status === 'recovery').length,
        readyCount: state.records.filter(r => r.status === 'ready').length,
      },
      history: state.history.past.map(() => 'snapshot')
    };
  };

  const handleExport = () => {
    const artifact = generateArtifact();
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library-lending-v1-recovery-board.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const validateArtifact = (data: any): data is SessionArtifact => {
    if (data.schemaVersion !== 'v1') return false;
    if (!Array.isArray(data.records)) return false;
    // Check for duplicate IDs
    const ids = new Set();
    for (const record of data.records) {
      if (ids.has(record.id)) return false;
      ids.add(record.id);
    }
    return true;
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (validateArtifact(json)) {
          dispatch({ type: 'IMPORT_ARTIFACT', payload: json });
        } else {
          setErrorMsg('Malformed schema or invalid constraints.');
        }
      } catch (err) {
        setErrorMsg('Invalid JSON file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    dispatch({
      type: 'IMPORT_ARTIFACT',
      payload: {
        schemaVersion: 'v1',
        exportedAt: new Date().toISOString(),
        records: [],
        derived: { totalCount: 0, recoveryCount: 0, readyCount: 0 },
        history: []
      }
    });
  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded shadow flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-3">
        <FileJson size={24} className="text-blue-400" />
        <div>
          <h3 className="font-bold">Session Artifact</h3>
          <p className="text-xs text-gray-400">Export or restore library state</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {errorMsg && <span className="text-red-400 text-sm font-bold bg-red-900/50 px-2 py-1 rounded">{errorMsg}</span>}
        <button
          className="bg-red-900 hover:bg-red-800 text-red-100 px-3 py-1 rounded text-sm transition-colors"
          onClick={handleClear}
        >
          Clear Memory
        </button>
        <div className="h-6 w-px bg-gray-600 mx-1"></div>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImport}
        />
        <button
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={16} /> Import
        </button>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded transition-colors"
          onClick={handleExport}
        >
          <Download size={16} /> Export JSON
        </button>
      </div>
    </div>
  );
};
