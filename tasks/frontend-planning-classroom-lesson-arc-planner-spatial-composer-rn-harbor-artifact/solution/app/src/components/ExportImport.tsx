import { useState } from 'react';
import { useAppStore } from '../store';
import { SessionSchema } from '../schema';
import { Download, Upload, AlertCircle } from 'lucide-react';

export function ExportImport() {
  const store = useAppStore();
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const session = {
      schemaVersion: 'shapeshift-session-v1',
      exportedAt: new Date().toISOString(),
      records: store.records,
      derived: store.derived,
      history: store.history,
      zones: store.zones,
    };

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lesson-arc-v1-spatial-composer.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const parsed = SessionSchema.safeParse(json);

        if (!parsed.success) {
          // Find the first descriptive error
          const errorMsg = parsed.error.issues[0].message || 'Invalid format';
          const path = parsed.error.issues[0].path.join('.');
          setImportError(`Validation failed at ${path}: ${errorMsg}`);
          return;
        }

        // Additional domain validation: check if total capacity exceeds max
        for (const zone of parsed.data.zones) {
            let cap = 0;
            for(const rid of zone.recordIds) {
                const rec = parsed.data.records.find(r => r.id === rid);
                if (rec) cap += rec.capacity;
            }
            if (cap > zone.maxCapacity) {
                 setImportError(`Invalid state: Zone ${zone.id} exceeds capacity.`);
                 return;
            }
        }

        // Apply new exportedAt to simulate regeneration on valid import
        parsed.data.exportedAt = new Date().toISOString();

        store.clearSession(); // Clear first
        store.importSession(parsed.data);
        setImportError(null);
      } catch (err) {
        setImportError('Failed to parse JSON.');
      }
      // Reset input
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-4 border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div>
          <h3 className="font-semibold text-slate-800">Session Artifact</h3>
          <p className="text-xs text-slate-500">
            {store.records.length} records • {store.history.length} history states
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {importError && (
            <div className="flex items-center text-red-600 text-sm bg-red-50 px-3 py-1.5 rounded">
              <AlertCircle size={16} className="mr-2" />
              {importError}
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={() => store.clearSession()}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
            >
              Clear
            </button>
            <label className="cursor-pointer px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center">
              <Upload size={16} className="mr-2" />
              Import JSON
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center shadow-sm"
            >
              <Download size={16} className="mr-2" />
              Export JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
