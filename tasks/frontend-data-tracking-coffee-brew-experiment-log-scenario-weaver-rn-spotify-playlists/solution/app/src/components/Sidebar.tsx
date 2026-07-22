import React from 'react';
import { useStore } from '../store';
import { Coffee, Download, Upload, Trash2, Archive, Plus } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { createRecord, exportArtifact, importArtifact, clearSession, selection, archiveSelected, deleteSelected } = useStore();

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        // Use Zod for runtime validation
        const { artifactSchema } = await import('../schemas');
        const parsed = artifactSchema.safeParse(json);

        if (parsed.success) {
          importArtifact(parsed.data);
        } else {
          alert('Invalid artifact format or schema bounds failed');
          console.error(parsed.error);
        }
      } catch (_err) {
        alert('Failed to parse JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const artifact = exportArtifact();
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brew-experiment-v1-scenario-weaver.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <nav className="w-16 md:w-64 bg-primary-dark text-surface flex flex-col items-center md:items-stretch py-4 shrink-0 shadow-lg">
      <div className="flex items-center justify-center md:justify-start md:px-6 mb-8 gap-3">
        <Coffee className="w-8 h-8 text-accent" />
        <span className="hidden md:block font-bold text-lg tracking-tight">Kurry Brews</span>
      </div>

      <div className="flex-1 flex flex-col gap-2 px-2 md:px-4">
        <button
          onClick={() => createRecord({})}
          className="flex items-center justify-center md:justify-start gap-3 p-3 rounded-md hover:bg-primary/50 transition-colors bg-primary"
          aria-label="New Experiment"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden md:inline font-medium">New Experiment</span>
        </button>

        {selection.length > 0 && (
          <div className="mt-4 pt-4 border-t border-primary-light flex flex-col gap-2">
            <div className="hidden md:block text-xs font-semibold text-accent uppercase px-2 mb-1">
              Bulk Actions ({selection.length})
            </div>
            <button
              onClick={archiveSelected}
              className="flex items-center justify-center md:justify-start gap-3 p-3 rounded-md hover:bg-primary/50 transition-colors"
              aria-label="Archive Selected"
            >
              <Archive className="w-5 h-5" />
              <span className="hidden md:inline">Archive</span>
            </button>
            <button
              onClick={deleteSelected}
              className="flex items-center justify-center md:justify-start gap-3 p-3 rounded-md hover:bg-red-500/50 transition-colors"
              aria-label="Delete Selected"
            >
              <Trash2 className="w-5 h-5" />
              <span className="hidden md:inline">Delete</span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-auto px-2 md:px-4 flex flex-col gap-2 pt-4 border-t border-primary-light">
        <button
          onClick={handleExport}
          className="flex items-center justify-center md:justify-start gap-3 p-3 rounded-md hover:bg-primary/50 transition-colors"
          aria-label="Export"
        >
          <Download className="w-5 h-5" />
          <span className="hidden md:inline">Export Artifact</span>
        </button>

        <label className="flex items-center justify-center md:justify-start gap-3 p-3 rounded-md hover:bg-primary/50 transition-colors cursor-pointer" aria-label="Import">
          <Upload className="w-5 h-5" />
          <span className="hidden md:inline">Import Session</span>
          <input type="file" accept=".json" className="hidden" onChange={handleImport} />
        </label>

        <button
          onClick={clearSession}
          className="flex items-center justify-center md:justify-start gap-3 p-3 rounded-md hover:bg-red-500/50 transition-colors text-red-200"
          aria-label="Clear Session"
        >
          <Trash2 className="w-5 h-5" />
          <span className="hidden md:inline">Clear Session</span>
        </button>
      </div>
    </nav>
  );
};
