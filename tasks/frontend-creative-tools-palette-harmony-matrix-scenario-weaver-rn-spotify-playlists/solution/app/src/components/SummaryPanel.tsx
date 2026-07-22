import { useState } from 'react';
import { useStore } from '../store';

export function SummaryPanel() {
  const { getDerivedStats, exportSession, importSession, clear } = useStore();
  const stats = getDerivedStats();
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const data = exportSession();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'palette-harmony-v1-scenario-weaver.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          const result = importSession(content);
          if (!result.success) {
            setImportError("Invalid artifact format or bounded values.");
          } else {
            setImportError(null);
          }
        } catch (err) {
          setImportError("Malformed JSON.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-full bg-bg-elevated rounded-lg p-6">
      <h2 className="text-xl font-bold text-text-title mb-6">Derived Summary</h2>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-bg-base p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-white">{stats.totalCount}</div>
          <div className="text-xs text-text-base uppercase tracking-wider mt-1">Total Colors</div>
        </div>
        <div className="bg-bg-base p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-primary">{stats.readyCount}</div>
          <div className="text-xs text-text-base uppercase tracking-wider mt-1">Ready</div>
        </div>
        <div className="bg-bg-base p-4 rounded-lg text-center col-span-2">
          <div className="text-xl font-bold text-white/50">{stats.archivedCount}</div>
          <div className="text-xs text-text-base uppercase tracking-wider mt-1">Archived</div>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        {importError && (
          <div className="text-red-400 text-sm p-2 bg-red-400/10 rounded mb-2 border border-red-400/20">
            {importError}
          </div>
        )}
        <button
          onClick={handleExport}
          className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded transition-colors"
        >
          Export Artifact
        </button>
        <button
          onClick={handleImportClick}
          className="w-full py-2.5 bg-transparent border border-white/20 hover:bg-white/5 text-white font-medium rounded transition-colors"
        >
          Import Artifact
        </button>
        <button
          onClick={clear}
          className="w-full py-2.5 text-red-400 hover:bg-red-400/10 font-medium rounded transition-colors"
        >
          Clear Workspace
        </button>
      </div>
    </div>
  );
}
