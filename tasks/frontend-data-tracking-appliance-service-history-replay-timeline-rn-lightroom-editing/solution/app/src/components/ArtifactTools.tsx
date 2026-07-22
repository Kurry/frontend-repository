import React, { useRef, useState } from 'react';
import { Download, Upload, AlertCircle, Check } from 'lucide-react';
import { useStore } from '../store';
import { ArtifactSchemaZod } from '../utils';

export default function ArtifactTools() {
  const { exportArtifact, importArtifact } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExport = () => {
    const artifact = exportArtifact();
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appliance-service-v1-replay-timeline.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const validated = ArtifactSchemaZod.parse(json);

        // Regenerate exportedAt for roundtrip requirement
        const importedData = {
          ...validated,
          exportedAt: new Date().toISOString()
        };

        importArtifact(importedData);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } catch (err: any) {
        console.error("Import validation failed:", err);
        setError("Invalid artifact schema. Check console for details.");
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-2 relative">
      <input
        type="file"
        accept=".json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImport}
        aria-label="Import Artifact"
      />

      {error && (
        <div className="absolute right-0 top-full mt-2 w-64 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded shadow-lg flex items-start gap-1 z-50">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="absolute right-0 top-full mt-2 w-32 p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded shadow-lg flex items-center justify-center gap-1 z-50">
          <Check className="w-4 h-4" />
          <p>Success</p>
        </div>
      )}

      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
      >
        <Upload className="w-4 h-4" />
        <span className="hidden sm:inline">Import</span>
      </button>

      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md text-white bg-slate-800 hover:bg-slate-900 transition-colors shadow-sm"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export Artifact</span>
      </button>
    </div>
  );
}
