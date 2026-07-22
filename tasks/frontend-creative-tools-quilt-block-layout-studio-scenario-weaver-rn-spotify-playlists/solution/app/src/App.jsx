import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import { Plus, Undo2, Download, Upload, Trash2, Edit2, Play, GitBranch } from 'lucide-react';

const SEED_DATA = [
  { id: '1', name: 'Morning Star', status: 'ready', scenarioWeaverState: 'idle' },
  { id: '2', name: 'Log Cabin', status: 'draft', scenarioWeaverState: 'idle' },
  { id: '3', name: 'Flying Geese', status: 'empty', scenarioWeaverState: 'idle' },
  { id: '4', name: 'Bear Paw', status: 'changed', scenarioWeaverState: 'conflict' },
  ...Array.from({ length: 96 }).map((_, i) => ({
    id: `perf-${i}`,
    name: `Block ${i}`,
    status: 'archived',
    scenarioWeaverState: 'idle'
  }))
];

function App() {
  const {
    records,
    history,
    selectedId,
    scenarioMode,
    error,
    init,
    createRecord,
    updateRecord,
    deleteRecord,
    selectRecord,
    setScenarioMode,
    branchScenario,
    undo,
    importData,
    setError
  } = useStore();

  const [filterStatus, setFilterStatus] = useState('all');
  const [formState, setFormState] = useState({ name: '', status: 'draft' });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    init(SEED_DATA);
  }, []);

  const handleExport = () => {
    const data = {
      schemaVersion: 'quilt-layout-v1',
      exportedAt: new Date().toISOString(),
      records,
      derived: {
        summary: `Total blocks: ${records.length}`
      },
      history
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quilt-layout-v1-scenario-weaver.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        importData(data);
      } catch (err) {
        setError('Malformed schema');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      setError('Name is required');
      return;
    }
    if (editMode && selectedId) {
      updateRecord(selectedId, formState);
    } else {
      createRecord(formState);
    }
    setFormState({ name: '', status: 'draft' });
    setEditMode(false);
  };

  const handleEdit = (record) => {
    selectRecord(record.id);
    setFormState({ name: record.name, status: record.status });
    setEditMode(true);
    setScenarioMode(false);
  };

  const handleBranch = (record) => {
    selectRecord(record.id);
    setScenarioMode(true);
    setEditMode(false);
  };

  const confirmBranch = () => {
    if (!selectedId) return;
    branchScenario(selectedId, { name: `${records.find(r => r.id === selectedId).name} (Scenario)` });
  };

  const filteredRecords = filterStatus === 'all'
    ? records
    : records.filter(r => r.status === filterStatus);

  const selectedRecord = records.find(r => r.id === selectedId);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col md:flex-row">
      {/* Sidebar / Tools */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-6">Quilt Block Layout Studio</h1>

        <div className="flex gap-2 mb-6">
          <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 p-2 rounded hover:bg-gray-200">
            <Download size={16} /> Export
          </button>
          <label className="flex-1 flex items-center justify-center gap-2 bg-gray-100 p-2 rounded hover:bg-gray-200 cursor-pointer">
            <Upload size={16} /> Import
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
        </div>

        <div className="mb-6">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 p-2 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <Undo2 size={16} /> Undo
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Filter</h2>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
          >
            <option value="all">All Statuses</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <form onSubmit={handleSubmit} className="mt-auto">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            {editMode ? 'Edit Block' : 'New Block'}
          </h2>
          <input
            type="text"
            placeholder="Block Name"
            value={formState.name}
            onChange={(e) => setFormState({ ...formState, name: e.target.value })}
            className="w-full border border-gray-300 rounded p-2 mb-2"
          />
          <select
            value={formState.status}
            onChange={(e) => setFormState({ ...formState, status: e.target.value })}
            className="w-full border border-gray-300 rounded p-2 mb-2"
          >
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            {editMode ? 'Save Changes' : 'Create Block'}
          </button>
          {editMode && (
            <button
              type="button"
              onClick={() => { setEditMode(false); setFormState({name:'', status:'draft'}); }}
              className="w-full bg-gray-100 text-gray-600 p-2 rounded mt-2 hover:bg-gray-200"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 p-6 relative flex flex-col">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
            <button className="text-sm underline mt-1" onClick={() => setError(null)}>Clear</button>
          </div>
        )}

        {scenarioMode && selectedRecord ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-blue-900 mb-2 flex items-center gap-2">
              <GitBranch /> Scenario Weaver
            </h2>
            <p className="text-blue-700 mb-4">
              Branching: <strong>{selectedRecord.name}</strong>
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmBranch}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Confirm Branch
              </button>
              <button
                onClick={() => setScenarioMode(false)}
                className="bg-white text-blue-600 px-4 py-2 rounded border border-blue-300 hover:bg-blue-50"
              >
                Cancel Scenario
              </button>
            </div>

            <div className="mt-4 text-sm text-blue-600">
              Derived Summary: Action will mutate status to 'changed' and fork history.
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max overflow-y-auto">
          {filteredRecords.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12">
              No blocks found. Create one or adjust filters.
            </div>
          ) : (
            filteredRecords.map(record => (
              <div
                key={record.id}
                className={`bg-white border rounded-lg p-4 shadow-sm transition-all ${selectedId === record.id ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{record.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    record.status === 'ready' ? 'bg-green-100 text-green-800' :
                    record.status === 'empty' ? 'bg-gray-100 text-gray-800' :
                    record.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    record.status === 'changed' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {record.status}
                  </span>
                </div>

                {record.scenarioWeaverState && record.scenarioWeaverState !== 'idle' && (
                  <div className="text-xs text-blue-600 mb-4 bg-blue-50 p-1 rounded inline-block">
                    Scenario: {record.scenarioWeaverState}
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleBranch(record)}
                    className="text-gray-500 hover:text-blue-600"
                    title="Branch to Scenario"
                  >
                    <GitBranch size={16} />
                  </button>
                  <button
                    onClick={() => handleEdit(record)}
                    className="text-gray-500 hover:text-gray-900 ml-auto"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this block?')) {
                        deleteRecord(record.id);
                      }
                    }}
                    className="text-gray-500 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
