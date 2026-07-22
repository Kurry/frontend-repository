import React, { useState } from 'react';
import { useStore } from './store';

export default function App() {
  const {
    records, derived, history, selectedIds,
    toggleSelection, groupAndReconcile, undo, importData,
    addRecord, updateRecord, deleteRecord
  } = useStore();

  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleExport = () => {
    const data = {
      schemaVersion: "v1",
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fit-annotations-v1-batch-reconciler.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 0);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        importData(data);
      } catch (err) {
        console.error("Invalid JSON", err);
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditName(record.name);
  };

  const saveEdit = (id) => {
    if (editName.trim()) {
      updateRecord(id, { name: editName });
    }
    setEditingId(null);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    if (name.trim()) {
      addRecord({
        id: Math.random().toString(36).substr(2, 9),
        name,
        status: 'draft'
      });
      e.target.reset();
    }
  };

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Apparel Fit Annotation Studio</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={groupAndReconcile}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Group & Reconcile Batch
          </button>
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Undo
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50 transition-colors"
          >
            Export
          </button>
          <label className="px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50 cursor-pointer transition-colors">
            Import
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <main className="md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Records</h2>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="border border-gray-300 rounded p-1"
            >
              <option value="all">All Statuses</option>
              <option value="empty">Empty</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <form onSubmit={handleAdd} className="mb-4 flex gap-2">
            <input
              name="name"
              placeholder="New annotation name..."
              className="border border-gray-300 rounded px-3 py-2 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors">Add</button>
          </form>

          {records.length === 0 ? (
            <div className="p-8 text-center text-gray-500 border border-dashed rounded bg-gray-50">
              <p>No records found. Add one above or import a session.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map(record => (
                <div
                  key={record.id}
                  className={`flex items-center gap-3 p-4 border rounded transition-all duration-300 ${selectedIds.has(record.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(record.id)}
                    onChange={() => toggleSelection(record.id)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                    aria-label={`Select ${record.name}`}
                  />

                  <div className="flex-grow">
                    {editingId === record.id ? (
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={() => saveEdit(record.id)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(record.id)}
                        className="border border-blue-500 rounded px-2 py-1 w-full"
                        autoFocus
                      />
                    ) : (
                      <div className="font-medium text-gray-900" onDoubleClick={() => startEdit(record)}>{record.name}</div>
                    )}
                    <div className="text-sm text-gray-500 mt-1">Status: <span className="font-medium text-gray-700">{record.status}</span></div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(record)}
                      className="text-gray-500 hover:text-gray-800 p-1"
                      aria-label="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteRecord(record.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      aria-label="Delete"
                    >
                      Del
                    </button>
                  </div>
                </div>
              ))}
              {filteredRecords.length === 0 && records.length > 0 && (
                <div className="p-8 text-center text-gray-500 border border-dashed rounded bg-gray-50">
                  <p>No records match the current filter.</p>
                </div>
              )}
            </div>
          )}
        </main>

        <aside className="space-y-6">
          <section className="p-5 border border-gray-200 rounded bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-3 border-b pb-2">Derived Summary</h2>
            <div className="text-gray-700 min-h-[4rem]" aria-live="polite">
              {derived.summary || "No derived summary."}
            </div>
          </section>

          <section className="p-5 border border-gray-200 rounded bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-3 border-b pb-2">Batch Reconciler</h2>
            <div className="text-sm text-gray-600">
              <p className="mb-2">Selected: <strong>{selectedIds.size}</strong> records</p>
              <p>Action updates status to <em>ready</em> and recalculates the aggregate summary.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
