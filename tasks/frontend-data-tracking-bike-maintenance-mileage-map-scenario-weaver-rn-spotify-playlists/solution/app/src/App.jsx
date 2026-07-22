import React, { useState } from 'react';
import { useStore } from './store';

export default function App() {
  const { state, actions } = useStore();
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [newRecordName, setNewRecordName] = useState('');
  const [importText, setImportText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [errorMsg, setErrorMsg] = useState(null);

  const handleCreate = () => {
    if (newRecordName.trim().length > 50) {
      setErrorMsg("Name exceeds maximum length of 50 characters.");
      return;
    }
    if (newRecordName.trim()) {
      actions.createRecord({ name: newRecordName.trim() });
      setNewRecordName('');
      setErrorMsg(null);
    } else {
      setErrorMsg("Name is required.");
    }
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditName(record.name);
    setErrorMsg(null);
  };

  const saveEdit = (id) => {
    if (editName.trim().length > 50) {
      setErrorMsg("Name exceeds maximum length of 50 characters. Previous valid name preserved.");
      setEditingId(null);
      return;
    }
    if (editName.trim()) {
      actions.updateRecord(id, { name: editName.trim() });
      setEditingId(null);
      setErrorMsg(null);
    } else {
      setErrorMsg("Name cannot be empty. Previous valid name preserved.");
      setEditingId(null);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'bike-maintenance-v1.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = () => {
    const err = actions.importData(importText);
    if (err) {
      setErrorMsg(`Import failed: ${err}`);
    } else {
      setErrorMsg(null);
      setImportText('');
    }
  };

  const moveUp = (e, index, id) => {
    e.stopPropagation();
    if (index > 0) {
      actions.reorderRecords(id, filteredRecords[index - 1].id);
    }
  };

  const moveDown = (e, index, id) => {
    e.stopPropagation();
    if (index < filteredRecords.length - 1) {
      actions.reorderRecords(id, filteredRecords[index + 1].id);
    }
  };

  let filteredRecords = [...state.records].sort((a, b) => a.order - b.order);
  if (filterStatus !== 'all') {
    filteredRecords = filteredRecords.filter(r => r.status === filterStatus);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8 font-sans">
      <header className="mb-6 md:mb-8 border-b pb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bike Maintenance Scenario Weaver</h1>
        <div className="flex flex-wrap gap-2 md:gap-4 mt-4">
          <button onClick={actions.undo} className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors focus:ring-2 focus:ring-gray-400">Undo (Ctrl+Z)</button>
          <button onClick={handleExport} className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-400">Export</button>
          <button onClick={actions.clear} className="px-3 py-1.5 md:px-4 md:py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors focus:ring-2 focus:ring-red-400">Clear</button>
        </div>
      </header>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded">
          {errorMsg}
        </div>
      )}

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold">Service Records</h2>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                type="text"
                value={newRecordName}
                onChange={e => setNewRecordName(e.target.value)}
                placeholder="New record name..."
                className="flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <button onClick={handleCreate} className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:ring-2 focus:ring-green-400">Add Record</button>
            </div>

            <div className="space-y-3">
              {filteredRecords.length === 0 && <p className="text-gray-500 italic">No records found.</p>}
              {filteredRecords.map((record, index) => (
                <div
                  key={record.id}
                  tabIndex="0"
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedRecordId(record.id)}
                  className={`p-3 md:p-4 border rounded-md cursor-pointer transition-all duration-200 ${selectedRecordId === record.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'}`}
                  onClick={() => setSelectedRecordId(record.id)}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div className="flex-1 w-full">
                      {editingId === record.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(record.id)}
                          onBlur={() => saveEdit(record.id)}
                          className="w-full border border-blue-400 rounded px-2 py-1 mb-1 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className="font-medium flex items-center gap-2">
                          {record.name}
                          <button onClick={(e) => { e.stopPropagation(); startEdit(record); }} className="text-xs text-blue-600 hover:underline">Edit</button>
                        </h3>
                      )}

                      <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-gray-200 rounded-full">{record.status}</span>
                        {record.isScenario && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Scenario</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                       <div className="flex flex-col mr-2">
                          <button onClick={(e) => moveUp(e, index, record.id)} disabled={index === 0} className="text-gray-400 hover:text-gray-800 disabled:opacity-30 leading-none">▲</button>
                          <button onClick={(e) => moveDown(e, index, record.id)} disabled={index === filteredRecords.length - 1} className="text-gray-400 hover:text-gray-800 disabled:opacity-30 leading-none">▼</button>
                       </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); actions.branchScenario(record.id); }}
                        className="text-sm px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 focus:ring-2 focus:ring-purple-400"
                        title="Branch into Scenario"
                      >
                        Branch
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); actions.archiveRecord(record.id); }}
                        className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 focus:ring-2 focus:ring-gray-300"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Import Data</h2>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="w-full h-32 border border-gray-300 rounded p-2 mb-2 font-mono text-sm focus:ring-2 focus:ring-gray-400"
              placeholder="Paste JSON here..."
            />
            <button onClick={handleImport} className="w-full sm:w-auto px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 focus:ring-2 focus:ring-gray-600">Import Session</button>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Total Records</dt>
                <dd className="font-medium">{state.derived.totalRecords}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Scenarios</dt>
                <dd className="font-medium">{state.derived.scenarios}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Schema Version</dt>
                <dd className="font-mono text-sm">{state.schemaVersion}</dd>
              </div>
            </dl>
          </div>

          {selectedRecordId && (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-blue-200 bg-blue-50/30">
              <h2 className="text-xl font-semibold mb-4 text-blue-900">Inspector</h2>
              <pre className="text-xs overflow-auto bg-white p-2 md:p-4 rounded border border-gray-200 max-h-96 whitespace-pre-wrap">
                {JSON.stringify(state.records.find(r => r.id === selectedRecordId), null, 2)}
              </pre>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
