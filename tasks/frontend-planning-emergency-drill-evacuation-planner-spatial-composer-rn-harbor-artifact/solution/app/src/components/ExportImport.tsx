import React, { useState } from 'react';
import { useAppStore, getDerivedState } from '../state';
import type { EmergencyDrillEvacuationPlannerSession } from '../state';

export const ExportImport: React.FC = () => {
  const { records, history, importSession } = useAppStore();
  const [importJson, setImportJson] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleExport = () => {
    const session: EmergencyDrillEvacuationPlannerSession = {
      schemaVersion: 'evacuation-drill-v1',
      exportedAt: new Date().toISOString(),
      records: records,
      derived: getDerivedState(records),
      history: history
    };

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'evacuation-drill-v1-spatial-composer.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (parsed.schemaVersion !== 'evacuation-drill-v1') {
        setErrorMsg('Invalid schemaVersion');
        return;
      }
      if (!Array.isArray(parsed.records)) {
        setErrorMsg('Invalid records array');
        return;
      }

      const ids = parsed.records.map((r: any) => r.id);
      if (new Set(ids).size !== ids.length) {
        setErrorMsg('Duplicate record IDs found');
        return;
      }

      setErrorMsg('');
      const validSession: EmergencyDrillEvacuationPlannerSession = {
        ...parsed,
        exportedAt: new Date().toISOString()
      };
      importSession(validSession);
      setImportJson('');
    } catch (e) {
      setErrorMsg('Malformed JSON');
    }
  };

  return (
    <div className="bg-white p-4 shadow rounded mt-4">
      <h2 className="text-xl font-bold mb-4">Portable Artifact</h2>
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 border p-4 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Export Session</h3>
          <p className="text-sm text-gray-600 mb-4">Download the current state as a fully interoperable JSON artifact.</p>
          <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition-colors w-full sm:w-auto">
            Export JSON
          </button>
        </div>

        <div className="flex-1 border p-4 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Import Session</h3>
          {errorMsg && <div className="text-red-600 text-sm font-semibold mb-2" role="alert">{errorMsg}</div>}
          <textarea
            className="w-full border rounded p-2 text-sm mb-2 font-mono h-24"
            placeholder="Paste session JSON here..."
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
          />
          <button onClick={handleImport} className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition-colors w-full sm:w-auto">
            Import JSON
          </button>
        </div>
      </div>
    </div>
  );
};
