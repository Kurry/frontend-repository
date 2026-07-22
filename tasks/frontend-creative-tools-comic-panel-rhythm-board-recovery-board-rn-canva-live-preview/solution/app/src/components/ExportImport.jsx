import React, { useRef, useState } from 'react';
import { useStore } from '../Store';
import { validateSession } from '../utils/schema';
import { Download, Upload } from 'lucide-react';

export const ExportImport = () => {
  const { records, history, derived, loadSession } = useStore();
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');

  const handleExport = () => {
    const sessionData = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comic-rhythm-v1-recovery-board.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    setError('');
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        validateSession(json);
        // Regenerate exportedAt implicitly by not copying it, or storing a new import timestamp
        loadSession({
          records: json.records,
          history: json.history || []
        });
      } catch (err) {
        console.error(err);
        setError(`Import failed: ${err.message}`);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm transition-colors shadow-sm"
        >
          <Download size={16} /> Export
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm transition-colors shadow-sm"
        >
          <Upload size={16} /> Import
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          className="hidden"
        />
      </div>
      {error && <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">{error}</span>}
    </div>
  );
};
