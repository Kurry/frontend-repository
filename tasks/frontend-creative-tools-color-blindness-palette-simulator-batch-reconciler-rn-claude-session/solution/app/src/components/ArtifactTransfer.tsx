import { useRef } from 'react';
import { useStore, artifactSchema, type Artifact } from '../store';

export function ArtifactTransfer() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const state = useStore.getState();
    const artifact: Artifact = {
      schemaVersion: state.schemaVersion,
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history,
    };

    const parseResult = artifactSchema.safeParse(artifact);
    if (!parseResult.success) {
      useStore.getState().setRecoveryMessage(`Export failed: invalid internal state`);
      return;
    }

    const blob = new Blob([JSON.stringify(parseResult.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'palette-simulation-v1-batch-reconciler.json';
    document.body.appendChild(a);
    a.click();

    useStore.setState({ saveHealth: 'saved', exportedAt: parseResult.data.exportedAt });
    useStore.getState().setRecoveryMessage('Artifact exported successfully.');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const json = JSON.parse(text);

        const parseResult = artifactSchema.safeParse(json);
        if (!parseResult.success) {
          useStore.getState().setRecoveryMessage(`Import failed: ${parseResult.error.issues[0].message} at ${parseResult.error.issues[0].path.join('.')}`);
        } else {
          useStore.getState().importArtifact(parseResult.data as Artifact);
        }
      } catch (err) {
        useStore.getState().setRecoveryMessage('Import failed: malformed JSON file.');
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col gap-2 border p-4 bg-white rounded shadow-sm">
      <h3 className="font-bold border-b pb-2">Portable Work Artifact</h3>
      <p className="text-sm text-gray-600 mb-2">
        Export your current session to a portable JSON file, or restore a previous session.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 bg-gray-800 text-white py-2 rounded font-semibold hover:bg-gray-900 transition"
        >
          Export Artifact
        </button>
        <button
          onClick={handleClear}
          className="flex-1 border border-gray-800 text-gray-800 py-2 rounded font-semibold hover:bg-gray-100 transition"
        >
          Import Artifact
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
        />
      </div>
    </div>
  );
}
