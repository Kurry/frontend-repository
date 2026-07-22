import { useRef, useState } from 'react';
import { Download, Upload, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import type { CommunityGardenWorkdayPlannerSession } from '../types';

interface ArtifactManagerProps {
  onExport: () => void;
  onImport: (session: CommunityGardenWorkdayPlannerSession) => void;
  onClear: () => void;
  lastExportedAt: string | null;
}

export function ArtifactManager({ onExport, onImport, onClear, lastExportedAt }: ArtifactManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Basic validation
        if (parsed.schemaVersion !== 'v1') {
          throw new Error('Invalid schema version. Expected v1.');
        }
        if (!Array.isArray(parsed.records)) {
          throw new Error('Invalid schema: records must be an array.');
        }

        // Field-level validation
        const ids = new Set();
        for (const record of parsed.records) {
          if (!record.id || typeof record.id !== 'string') {
             throw new Error('Invalid schema: record missing id.');
          }
          if (ids.has(record.id)) {
            throw new Error(`Invalid schema: duplicate ID found (${record.id}).`);
          }
          ids.add(record.id);

          if (!record.title || typeof record.title !== 'string') {
             throw new Error(`Invalid schema: record ${record.id} missing title.`);
          }
          if (!['draft', 'ready', 'changed', 'archived'].includes(record.status)) {
             throw new Error(`Invalid schema: record ${record.id} has invalid status.`);
          }
          if (record.budget !== undefined && (typeof record.budget !== 'number' || record.budget < 0)) {
             throw new Error(`Invalid schema: record ${record.id} has invalid budget.`);
          }
        }

        // Cross-record reference validation
        for (const record of parsed.records) {
           if (record.dependencies && Array.isArray(record.dependencies)) {
              for (const dep of record.dependencies) {
                 if (!ids.has(dep)) {
                    throw new Error(`Invalid schema: unknown reference ${dep} in record ${record.id}.`);
                 }
              }
           }
        }

        onImport(parsed);
        setImportStatus({ type: 'success', message: 'Artifact imported successfully.' });

        // Clear input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';

        setTimeout(() => setImportStatus(null), 3000);
      } catch (err: any) {
        setImportStatus({ type: 'error', message: err.message || 'Failed to parse JSON file.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Portable Artifact</h3>
        {lastExportedAt && (
          <span className="text-xs text-slate-500">
            Last exported: {new Date(lastExportedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onExport}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 px-3 rounded text-sm font-medium transition-colors"
          aria-label="Export artifact"
        >
          <Download size={16} /> Export
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 py-2 px-3 rounded text-sm font-medium transition-colors"
          aria-label="Import artifact"
        >
          <Upload size={16} /> Import
        </button>

        <button
          onClick={onClear}
          className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 px-3 rounded text-sm font-medium transition-colors"
          aria-label="Clear session"
          title="Clear session state"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {importStatus && (
        <div className={`mt-3 p-2 rounded text-xs flex items-center gap-2 ${
          importStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {importStatus.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
          {importStatus.message}
        </div>
      )}
    </div>
  );
}
