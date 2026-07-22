import React, { useRef, useState } from 'react';
import { useStore } from 'zustand';
import { usePackingStore, type ArtifactSchema, type Status } from '../store';

export function ExportImport() {
  const store = useStore(usePackingStore);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    const state = usePackingStore.getState();
    const artifact: ArtifactSchema = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.items,
      derived: state.getDerivedState(),
      history: state.pastActions
    };

    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carry-on-pack-v1.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const validateArtifact = (data: any): data is ArtifactSchema => {
    if (!data || typeof data !== 'object') return false;
    if (data.schemaVersion !== 'v1') return false;
    if (!Array.isArray(data.records)) return false;

    // Check uniqueness of IDs
    const ids = data.records.map((r: any) => r.id);
    if (new Set(ids).size !== ids.length) return false;

    // Check boundary and enums
    const validStatuses: Status[] = ['empty', 'draft', 'ready', 'changed', 'archived'];
    for (const record of data.records) {
      if (!record.id || !record.name || typeof record.weight !== 'number' || typeof record.volume !== 'number') return false;
      if (!validStatuses.includes(record.status)) return false;
      if (record.weight <= 0 || record.volume <= 0) return false;
    }

    return true;
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (validateArtifact(parsed)) {
          // Regenerate exportedAt to reflect import transaction semantics as requested
          parsed.exportedAt = new Date().toISOString();
          store.importArtifact(parsed);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          setError('Invalid artifact format. Missing required fields, unknown enums, boundary violations, or duplicate IDs.');
        }
      } catch (err) {
        setError('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-gray-50 border-t border-gray-200 p-4 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded">
      <div className="flex gap-4">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Export Artifact
        </button>
        <button
          onClick={() => store.clearSession()}
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 font-medium focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Clear Session
        </button>
      </div>

      <div className="flex items-center gap-4">
        <label className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium cursor-pointer focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
          Import Artifact
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImport}
            className="sr-only"
          />
        </label>
      </div>

      {/* ARIA live region for errors */}
      <div aria-live="polite" className="text-red-600 text-sm font-medium">
        {error}
      </div>
    </div>
  );
}
