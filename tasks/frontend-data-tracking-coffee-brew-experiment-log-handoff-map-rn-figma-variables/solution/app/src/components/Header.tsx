import { useState } from 'react';
import { useStore } from '../store';
import { z } from 'zod';
import type { CoffeeBrewExperimentLogSession } from '../types';

const sessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(z.object({
    id: z.string(),
    title: z.string().min(1).max(100),
    beanWeight: z.number().min(0).max(1000),
    waterVolume: z.number().min(0).max(5000),
    temperature: z.number().min(0).max(100),
    status: z.enum(['empty', 'draft', 'ready', 'changed', 'archived']),
    handoffMapState: z.object({
      owner: z.string(),
      readiness: z.enum(['low', 'medium', 'high']),
      x: z.number().optional(),
      y: z.number().optional()
    })
  })),
  derived: z.object({
    summary: z.string()
  }),
  history: z.array(z.object({
    timestamp: z.string(),
    action: z.string(),
    recordId: z.string().optional(),
    details: z.string()
  }))
});

export const Header: React.FC = () => {
  const { undo, clear, exportSession, importSession, undoStack, getDerivedState } = useStore();
  const [showExport, setShowExport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  const derived = getDerivedState();

  const handleCopy = () => {
    const session = exportSession();
    navigator.clipboard.writeText(JSON.stringify(session, null, 2));
    alert('Copied to clipboard');
  };

  const handleDownload = () => {
    const session = exportSession();
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brew-experiment-v1-handoff-map.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      const result = sessionSchema.safeParse(parsed);

      if (!result.success) {
        setImportError(result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '));
        return;
      }

      // Check unique IDs
      const ids = result.data.records.map(r => r.id);
      if (new Set(ids).size !== ids.length) {
        setImportError('Duplicate record IDs found.');
        return;
      }

      const importedSession = result.data as CoffeeBrewExperimentLogSession;
      importedSession.exportedAt = new Date().toISOString();

      importSession(importedSession);
      setShowExport(false);
      setImportError('');
      setImportText('');
    } catch (e) {
      setImportError('Invalid JSON format.');
    }
  };

  return (
    <div className="bg-stone-900 text-stone-100 p-4 flex justify-between items-center shadow-md shrink-0">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold tracking-wider uppercase text-amber-500">Coffee Brew Log</h1>
        <div className="hidden md:block text-sm text-stone-400 border-l border-stone-700 pl-4">{derived.summary}</div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-stone-800 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          Undo
        </button>
        <button
          onClick={() => confirm('Clear all data?') && clear()}
          className="px-3 py-1.5 rounded text-sm font-medium transition-colors bg-stone-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Clear
        </button>
        <button
          onClick={() => setShowExport(!showExport)}
          className="px-4 py-1.5 rounded text-sm font-medium transition-colors bg-amber-600 hover:bg-amber-500 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          Export / Import
        </button>
      </div>

      {showExport && (
        <div className="absolute top-16 right-4 w-96 bg-white rounded-lg shadow-2xl border border-stone-200 z-50 text-stone-800 flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-stone-200 flex justify-between items-center">
             <h3 className="font-bold">Session Artifact</h3>
             <button onClick={() => setShowExport(false)} className="text-stone-500 hover:text-stone-800 p-1 font-bold">×</button>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-2 uppercase tracking-wide text-stone-500">Export</h4>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 py-2 rounded font-medium transition-colors text-sm border border-stone-300">Copy JSON</button>
                <button onClick={handleDownload} className="flex-1 bg-stone-800 hover:bg-stone-700 text-white py-2 rounded font-medium transition-colors text-sm">Download</button>
              </div>
            </div>

            <div className="border-t border-stone-200 pt-4">
              <h4 className="text-sm font-semibold mb-2 uppercase tracking-wide text-stone-500">Import</h4>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="Paste Session JSON here..."
                className="w-full h-32 p-2 border border-stone-300 rounded text-xs font-mono mb-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              {importError && <p className="text-red-500 text-xs mb-2 p-2 bg-red-50 rounded">{importError}</p>}
              <button
                onClick={handleImport}
                className="w-full bg-stone-800 hover:bg-stone-700 text-white py-2 rounded font-medium transition-colors text-sm"
              >
                Import Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
