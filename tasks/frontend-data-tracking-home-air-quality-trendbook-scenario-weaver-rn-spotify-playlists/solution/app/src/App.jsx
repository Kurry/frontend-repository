import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppState, STATUSES } from './store';
import { Download, Upload, Trash2, Edit2, CornerDownRight, Undo2, X } from 'lucide-react';
import './webmcp';

const validateRecord = (record) => {
  if (!record.location || record.location.trim() === '') return false;
  if (record.aqi === undefined || record.aqi < 0 || record.aqi > 500) return false;
  return true;
};

const ErrorBoundary = ({ children, error, onDismiss }) => {
  if (!error) return children;
  return (
    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4 flex justify-between items-start">
      <div>
        <h3 className="font-bold">Error</h3>
        <p>{error}</p>
        <p className="text-sm mt-1">Please correct the invalid fields or restore the prior state.</p>
      </div>
      <button onClick={onDismiss} className="text-red-700 hover:text-red-900"><X size={16} /></button>
    </div>
  );
};

export default function App() {
  const state = useAppState();
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleAdd = () => {
    const newRecord = {
      id: uuidv4(),
      location: 'New Location',
      aqi: 50,
      pm25: 12.0,
      status: 'draft',
      scenarioWeaverState: 'idle'
    };
    state.addRecord(newRecord);
  };

  const handleEditStart = (record) => {
    setEditingId(record.id);
    setEditForm(record);
    setError(null);
  };

  const handleEditSave = (id) => {
    if (!validateRecord(editForm)) {
      setError(`Invalid values for record. AQI must be between 0 and 500. Location must not be empty.`);
      return;
    }
    state.updateRecord(id, editForm);
    setEditingId(null);
    setError(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setError(null);
  };

  const handleExport = () => {
    const payload = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'air-quality-v1-scenario-weaver.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.schemaVersion !== 'v1') throw new Error('Invalid schema version');
        if (!Array.isArray(data.records)) throw new Error('Invalid records array');

        // Field level validation
        const validRecords = data.records.every(r => r.id && typeof r.aqi === 'number' && typeof r.location === 'string');
        if (!validRecords) throw new Error('Malformed records inside artifact');

        data.exportedAt = new Date().toISOString();
        state.setFullState(data);
        setError(null);
      } catch (err) {
        setError(`Failed to import: ${err.message}. Prior state preserved.`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  // Bind state to window for testing/WebMCP
  if (typeof window !== 'undefined') {
      window.__APP_STATE__ = state;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8 flex flex-col md:flex-row gap-6">

      {/* Primary Work Surface */}
      <main className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full overflow-hidden">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Air Readings Collection</h1>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Add Record
            </button>
            <button onClick={state.undo} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1" title="Undo (Ctrl+Z)">
              <Undo2 size={16} /> Undo
            </button>
          </div>
        </header>

        <ErrorBoundary error={error} onDismiss={() => setError(null)}>
          <div className="overflow-x-auto flex-1">
            {state.records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <p>No records found. Add or import records.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-sm text-gray-500 bg-gray-50">
                    <th className="p-3 font-medium">Location</th>
                    <th className="p-3 font-medium">AQI</th>
                    <th className="p-3 font-medium">PM2.5</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {state.records.map((record, index) => (
                    <tr
                      key={record.id}
                      className={`group transition-colors duration-200 ease-in-out hover:bg-blue-50/50
                        ${state.selectedRecordId === record.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                    >
                      {editingId === record.id ? (
                        <>
                          <td className="p-3"><input type="text" className="border rounded px-2 py-1 w-full" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} /></td>
                          <td className="p-3"><input type="number" className="border rounded px-2 py-1 w-20" value={editForm.aqi} onChange={e => setEditForm({...editForm, aqi: Number(e.target.value)})} /></td>
                          <td className="p-3"><input type="number" className="border rounded px-2 py-1 w-20" value={editForm.pm25} onChange={e => setEditForm({...editForm, pm25: Number(e.target.value)})} /></td>
                          <td className="p-3">
                            <select className="border rounded px-2 py-1" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="p-3 text-right space-x-2 flex justify-end">
                            <button onClick={() => handleEditSave(record.id)} className="text-green-600 hover:text-green-800 text-sm font-medium">Save</button>
                            <button onClick={handleEditCancel} className="text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 font-medium">{record.location}</td>
                          <td className="p-3">
                            <span className={`inline-flex px-2 py-1 rounded text-sm ${record.aqi > 100 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                              {record.aqi}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600">{record.pm25}</td>
                          <td className="p-3">
                            <span className="capitalize text-sm text-gray-600 border border-gray-200 px-2 py-1 rounded bg-white">
                              {record.status}
                            </span>
                          </td>
                          <td className="p-3 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                            <button
                                onClick={() => state.setSelectedRecordId(record.id)}
                                className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-md flex items-center gap-1"
                                title="Branch into Scenario"
                                aria-label={`Branch record ${record.location} into scenario`}
                            >
                              <CornerDownRight size={16} /> <span className="sr-only">Branch</span>
                            </button>
                            <button onClick={() => handleEditStart(record)} className="text-gray-600 hover:bg-gray-100 p-1.5 rounded-md">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => state.deleteRecord(record.id)} className="text-red-600 hover:bg-red-100 p-1.5 rounded-md">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ErrorBoundary>
      </main>

      {/* Secondary Panels (Scenario Weaver & Details) */}
      <aside className="w-full md:w-80 flex flex-col gap-6">

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CornerDownRight size={18} className="text-blue-600"/> Scenario Weaver
            </h2>

            {state.selectedRecordId ? (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Branching selected record into a new scenario variant.</p>
                    {(() => {
                        const rec = state.records.find(r => r.id === state.selectedRecordId);
                        if (!rec) return null;
                        return (
                            <div className="bg-gray-50 p-3 rounded border border-gray-100 text-sm">
                                <div className="font-medium">{rec.location}</div>
                                <div className="text-gray-500">Current AQI: {rec.aqi}</div>
                            </div>
                        )
                    })()}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 block">Simulate AQI Change</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => state.branchScenario(state.selectedRecordId, { aqi: Math.max(0, (state.records.find(r=>r.id===state.selectedRecordId)?.aqi || 0) - 20) })}
                                className="flex-1 bg-green-50 text-green-700 border border-green-200 py-1.5 rounded text-sm hover:bg-green-100 transition-colors"
                            >
                                -20 AQI
                            </button>
                            <button
                                onClick={() => state.branchScenario(state.selectedRecordId, { aqi: (state.records.find(r=>r.id===state.selectedRecordId)?.aqi || 0) + 50 })}
                                className="flex-1 bg-orange-50 text-orange-700 border border-orange-200 py-1.5 rounded text-sm hover:bg-orange-100 transition-colors"
                            >
                                +50 AQI
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-gray-400 text-sm text-center py-6">
                    Select a record's branch action to begin scenario comparison.
                </div>
            )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
            <h2 className="text-lg font-bold mb-4">Derived Summary</h2>
            <div className="space-y-3 text-sm">
                <div className="flex justify-between pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Records</span>
                    <span className="font-medium">{state.records.length}</span>
                </div>
                {STATUSES.map(s => (
                    <div key={s} className="flex justify-between items-center">
                        <span className="capitalize text-gray-600">{s}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium">
                            {state.derived.summary[s] || 0}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
            <h2 className="text-lg font-bold mb-4">Artifact Workspace</h2>
            <div className="flex flex-col gap-3">
                <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    <Download size={16} /> Export Artifact
                </button>
                <label className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
                    <Upload size={16} /> Import Artifact
                    <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                </label>
            </div>
        </div>

      </aside>
    </div>
  );
}
