import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { Download, Upload, Copy, AlertCircle } from 'lucide-react';

export function ArtifactTools() {
  const getExportArtifact = useStore(state => state.getExportArtifact);
  const importArtifact = useStore(state => state.importArtifact);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    const data = getExportArtifact();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'costume-continuity-v1-scenario-weaver.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setError(null);
  };

  const handleCopy = async () => {
    const data = getExportArtifact();
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    // Could show a toast here
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const result = importArtifact(json);
        if (!result.success) {
          setError("Invalid format: " + result.error?.message?.slice(0, 50));
        } else {
          setError(null);
        }
      } catch (err) {
        setError("Invalid JSON file");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-surface hover:bg-surface-hover border border-border rounded-md text-sm font-medium transition-colors"
        >
          <Download size={16} /> Export
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-surface hover:bg-surface-hover border border-border rounded-md text-sm font-medium transition-colors"
        >
          <Upload size={16} /> Import
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center p-2 bg-surface hover:bg-surface-hover border border-border rounded-md text-sm font-medium transition-colors"
          title="Copy JSON"
        >
          <Copy size={16} />
        </button>
      </div>
      <input
        type="file"
        accept=".json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImport}
      />

      {error && (
        <div className="flex items-start gap-2 p-2 bg-danger/10 border border-danger/20 rounded-md text-danger text-xs">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
