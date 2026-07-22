import { useState } from 'react';
import { useStore, SessionState } from '../store';
import { Download, Upload, Copy } from 'lucide-react';
import { z } from 'zod';

const recordSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  mileage: z.number().min(0),
  status: z.enum(['empty', 'draft', 'ready', 'changed', 'archived']),
  lineageQuarantined: z.boolean().optional(),
});

export function ArtifactManager() {
  const storeState = useStore();
  const [importText, setImportText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getExportData = (): SessionState => {
    return {
      schemaVersion: 'bike-maintenance-v1',
      exportedAt: new Date().toISOString(),
      records: storeState.records,
      provenanceAtlasState: storeState.provenanceAtlasState,
      derived: storeState.derived,
      history: storeState.history,
    };
  };

  const handleExport = () => {
    const data = getExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bike-maintenance-v1-provenance-atlas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(getExportData(), null, 2));
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      if (data.schemaVersion !== 'bike-maintenance-v1') {
        throw new Error('Invalid schemaVersion');
      }
      if (!Array.isArray(data.records)) {
        throw new Error('Records must be an array');
      }

      // Check unique IDs and field schema
      const ids = new Set<string>();
      data.records.forEach((r: any) => {
        if (ids.has(r.id)) throw new Error('Duplicate ID found');
        ids.add(r.id);
        recordSchema.parse(r);
      });

      storeState.importSession({ ...data, exportedAt: new Date().toISOString() });
      setImportText('');
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Invalid JSON');
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white flex justify-between items-center shrink-0">
      <div className="flex gap-4 items-center">
        <h1 className="text-xl font-bold font-mono text-green-400">Bike Maintenance Mileage Map</h1>
        <span className="text-sm text-gray-400">/ Provenance Atlas</span>
      </div>
      <div className="flex gap-4 items-center">
        <div className="flex gap-2 items-center relative group">
          <input
            type="text"
            placeholder="Paste JSON to import..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm w-48"
          />
          <button onClick={handleImport} className="p-1 hover:bg-gray-700 rounded" title="Import"><Upload size={16} /></button>
          {error && <div className="absolute top-full mt-1 left-0 text-red-400 text-xs">{error}</div>}
        </div>
        <button onClick={handleCopy} className="p-1 hover:bg-gray-700 rounded flex items-center gap-1 text-sm"><Copy size={16} /> Copy</button>
        <button onClick={handleExport} className="p-1 hover:bg-gray-700 rounded flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 px-3"><Download size={16} /> Export JSON</button>
      </div>
    </div>
  );
}
