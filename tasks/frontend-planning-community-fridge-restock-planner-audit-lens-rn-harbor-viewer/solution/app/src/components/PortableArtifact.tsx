import { useRef, useState } from 'react';
import { useRestockState } from '../hooks/useRestockState';
import { Download, Upload, Trash2, FileJson } from 'lucide-react';

export function PortableArtifact() {
  const { state, exportArtifact, importArtifact, clearState } = useRestockState();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleExport = () => {
    const data = exportArtifact();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fridge-restock-v1-audit-lens.json';
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
        const json = JSON.parse(event.target?.result as string);
        const success = importArtifact(json);
        if (!success) {
          setError('Invalid artifact format. State unchanged.');
        } else {
          setError('');
        }
      } catch (err) {
        setError('Failed to parse JSON.');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="border rounded p-4 bg-white shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b pb-2">
        <FileJson className="text-muted" size={20} />
        <h3 className="font-bold">Portable Work Artifact</h3>
      </div>

      <div className="text-sm text-muted">
        Export your current session to a portable JSON artifact, or import a previous session.
      </div>

      {error && (
        <div className="text-xs text-error p-2 bg-red-50 rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors"
        >
          <Download size={16} /> Export Artifact
        </button>

        <input
          type="file"
          accept=".json"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImport}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors"
        >
          <Upload size={16} /> Import Artifact
        </button>

        <button
          onClick={clearState}
          className="flex items-center gap-2 text-error px-3 py-2 rounded text-sm hover:bg-red-50 transition-colors ml-auto"
        >
          <Trash2 size={16} /> Clear Session
        </button>
      </div>

      <div className="text-xs text-muted font-mono mt-2 pt-2 border-t">
        Records: {state.records.length} | Exported At: {state.exportedAt ? new Date(state.exportedAt).toLocaleString() : 'Never'}
      </div>
    </div>
  );
}
