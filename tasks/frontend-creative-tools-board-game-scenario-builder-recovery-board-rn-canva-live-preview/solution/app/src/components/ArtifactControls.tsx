import { useRef, useState } from 'react';
import { useStore } from '../store';
import type { Record } from '../store';
import { selectDerived } from '../store';
import * as z from 'zod';

const artifactSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string().datetime(),
  records: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    status: z.enum(['draft', 'ready', 'failed', 'recovered', 'archived']),
    recoveryBoardState: z.enum(['idle', 'selected', 'changed', 'conflict', 'resolved']),
    difficulty: z.number().min(1).max(10),
    linkedScenarioId: z.string().nullable().optional(),
  })),
  derived: z.object({
    summary: z.object({
      total: z.number(),
      failed: z.number(),
      recovered: z.number(),
    })
  }),
  history: z.array(z.any()), // Can validate history structure if needed, keeping any for now
});

export function ArtifactControls() {
  const records = useStore((state) => state.records);
  const history = useStore((state) => state.history);
  const setAllState = useStore((state) => state.setAllState);

  // Use current state to build derived
  const derived = selectDerived(useStore.getState());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    const artifact = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history,
    };

    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenario-builder-v1-recovery-board.json';
    document.body.appendChild(a);
    a.click();

    // Defer removal to prevent race condition in headless environments
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const validated = artifactSchema.parse(json);

        // Verify unique IDs
        const ids = new Set();
        for (const record of validated.records) {
          if (ids.has(record.id)) {
            throw new Error(`Duplicate ID found: ${record.id}`);
          }
          ids.add(record.id);
        }

        // Apply state
        setAllState(validated.records as Record[], validated.history);
        setError(null);
      } catch (err) {
        if (err instanceof z.ZodError) {
          setError(`Validation error: ${err.errors[0].path.join('.')} - ${err.errors[0].message}`);
        } else if (err instanceof Error) {
          setError(`Import failed: ${err.message}`);
        } else {
          setError('Invalid file format.');
        }
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setAllState([], []);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <button
          onClick={handleExport}
          className="bg-slate-800 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-slate-900 transition-colors"
        >
          Export JSON
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Import JSON
        </button>
        <button
          onClick={handleClear}
          className="text-slate-500 hover:text-slate-700 text-sm font-medium ml-2"
        >
          Clear Data
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
        />
      </div>
      {error && <p className="text-red-500 text-xs font-medium bg-red-50 p-2 rounded border border-red-100">{error}</p>}
    </div>
  );
}
