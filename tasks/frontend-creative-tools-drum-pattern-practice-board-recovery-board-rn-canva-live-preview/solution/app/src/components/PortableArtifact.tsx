import React, { useRef, useState } from 'react';
import { useDrumStore } from '../store/useDrumStore';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { z } from 'zod';

const drumStepSchema = z.object({
  id: z.string(),
  active: z.boolean(),
  velocity: z.number().min(0).max(1),
});

const drumTrackSchema = z.object({
  id: z.string(),
  instrument: z.string(),
  steps: z.array(drumStepSchema),
  muted: z.boolean(),
  solo: z.boolean(),
  volume: z.number().min(0).max(1),
});

const drumPatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  tempo: z.number().min(20).max(300),
  steps: z.number().int().min(1),
  tracks: z.array(drumTrackSchema),
});

export const PortableArtifact: React.FC = () => {
  const { pattern, importPattern } = useDrumStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(pattern, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drum-pattern-${pattern.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const result = drumPatternSchema.safeParse(json);

        if (result.success) {
          importPattern(result.data);
        } else {
          setError(`Invalid artifact: ${result.error.issues[0].message} at ${result.error.issues[0].path.join('.')}`);
        }
      } catch (err) {
        setError('Failed to parse JSON file.');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-4">
      {error && (
        <div className="flex items-center gap-1 text-red-400 text-sm bg-red-900/30 px-3 py-1.5 rounded">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleImport}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm transition-colors"
        aria-label="Import Pattern"
      >
        <Upload size={16} /> Import
      </button>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
        aria-label="Export Pattern"
      >
        <Download size={16} /> Export
      </button>
    </div>
  );
};
