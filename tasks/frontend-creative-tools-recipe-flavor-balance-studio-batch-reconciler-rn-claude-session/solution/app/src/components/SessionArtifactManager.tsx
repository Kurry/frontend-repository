import { useRef } from 'react';
import { useAppStore } from '../store';
import { Download, Upload, Trash2 } from 'lucide-react';
import type { RecipeFlavorBalanceStudioSession } from '../types';

export default function SessionArtifactManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const records = useAppStore(state => state.records);
  const derived = useAppStore(state => state.derived);
  const history = useAppStore(state => state.history);
  const importSession = useAppStore(state => state.importSession);
  const clearSession = useAppStore(state => state.clearSession);

  const handleExport = () => {
    const session: RecipeFlavorBalanceStudioSession = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history
    };

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flavor-balance-v1-batch-reconciler.json';
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
        const content = event.target?.result as string;
        const session = JSON.parse(content) as RecipeFlavorBalanceStudioSession;
        importSession(session);
      } catch (err) {
        console.error('Invalid JSON file', err);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleExport}
        className="flex items-center space-x-1 px-3 py-1.5 rounded bg-indigo-800 hover:bg-indigo-700 transition-colors"
        title="Export Session"
      >
        <Download size={16} />
        <span className="text-sm font-medium">Export</span>
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center space-x-1 px-3 py-1.5 rounded bg-indigo-800 hover:bg-indigo-700 transition-colors"
        title="Import Session"
      >
        <Upload size={16} />
        <span className="text-sm font-medium">Import</span>
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json"
        className="hidden"
      />

      <button
        onClick={clearSession}
        className="flex items-center space-x-1 px-3 py-1.5 rounded bg-red-900 hover:bg-red-800 transition-colors"
        title="Clear Session"
      >
        <Trash2 size={16} />
        <span className="text-sm font-medium">Clear</span>
      </button>
    </div>
  );
}
