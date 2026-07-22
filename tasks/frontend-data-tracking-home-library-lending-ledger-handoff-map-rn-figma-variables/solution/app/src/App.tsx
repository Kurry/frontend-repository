import React, { useEffect, useState } from 'react';
import { useStore } from "./store";
import type { BookStatus, BookReadiness, Book } from "./store";
import { Book as BookIcon, Download, Upload, Undo2, Plus, Trash2, Edit } from 'lucide-react';
import { z } from 'zod';

const schema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string().datetime(),
  records: z.array(z.object({
    id: z.string(),
    title: z.string().min(1),
    status: z.enum(['draft', 'ready', 'changed', 'archived']),
    owner: z.string(),
    readiness: z.enum(['idle', 'selected', 'changed', 'conflict', 'resolved']),
    createdAt: z.string().datetime()
  }))
});

function App() {
  const { records, selectedRecordId, history, selectRecord, connectHandoff, undo, importSession, addRecord, updateRecord, deleteRecord } = useStore();

  const [filter, setFilter] = useState<BookStatus | 'all'>('all');
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);
  const selectedRecord = records.find(r => r.id === selectedRecordId);

  const handleExport = () => {
    const data = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: records
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library-lending-v1-handoff-map.json';
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
        const result = schema.safeParse(json);
        if (result.success) {
          importSession(result.data);
          setImportError(null);
        } else {
          setImportError("Invalid import format.");
        }
      } catch (err) {
        setImportError("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-green-100 text-green-800',
    changed: 'bg-blue-100 text-blue-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <BookIcon className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-semibold tracking-tight text-slate-800">Home Library Lending Ledger</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Undo (Cmd/Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" /> Undo
          </button>

          <div className="h-6 w-px bg-slate-200"></div>

          <label className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            Import
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </header>

      {importError && (
        <div className="bg-red-50 text-red-600 px-6 py-3 border-b border-red-100 text-sm">
          {importError}
        </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel: Library List */}
        <div className="w-full md:w-1/2 lg:w-2/3 flex flex-col border-r border-slate-200 bg-white">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex gap-2">
              {(['all', 'draft', 'ready', 'changed', 'archived'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1 text-xs font-medium rounded-full capitalize transition-colors ${
                    filter === s
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => addRecord({ title: 'New Book', status: 'draft', owner: 'Unassigned', readiness: 'idle' })}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="Add Book"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid gap-3">
              {filteredRecords.map(book => (
                <div
                  key={book.id}
                  onClick={() => selectRecord(book.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedRecordId === book.id
                      ? 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') selectRecord(book.id);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-slate-900">{book.title}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[book.status]}`}>
                      {book.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Owner: {book.owner}</span>
                    <span className="capitalize text-slate-400 text-xs">Readiness: {book.readiness}</span>
                  </div>
                </div>
              ))}
              {filteredRecords.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  No books found in this view.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Handoff Map / Inspector */}
        <div className="w-full md:w-1/2 lg:w-1/3 bg-slate-50 flex flex-col">
          {selectedRecord ? (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-1">Inspector</h2>
                  <p className="text-sm text-slate-500">Manage handoff and details</p>
                </div>
                <button
                  onClick={() => {
                    deleteRecord(selectedRecord.id);
                    selectRecord(null);
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Title</label>
                  <input
                    type="text"
                    value={selectedRecord.title}
                    onChange={(e) => updateRecord(selectedRecord.id, { title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Status</label>
                    <select
                      value={selectedRecord.status}
                      onChange={(e) => updateRecord(selectedRecord.id, { status: e.target.value as BookStatus })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="changed">Changed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">ID</label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-md text-sm text-slate-400 font-mono truncate">
                      {selectedRecord.id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Handoff Map Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  Handoff Map Action
                </h3>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                      Connect a selected record to a handoff owner and update readiness.
                    </p>

                    <div className="flex gap-2">
                      <select id="handoff-owner-select" className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                        <option value="Alice">Alice</option>
                        <option value="Bob">Bob</option>
                        <option value="Charlie">Charlie</option>
                      </select>
                      <button
                        onClick={() => {
                          const select = document.getElementById('handoff-owner-select') as HTMLSelectElement;
                          connectHandoff(select.value, 'resolved');
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-sm"
                      >
                        Apply Handoff
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4">
                <Edit className="w-6 h-6 text-slate-300" />
              </div>
              <h2 className="text-lg font-medium text-slate-700 mb-2">No Book Selected</h2>
              <p className="text-slate-500 text-sm max-w-[250px]">
                Select a book from the library to view details and manage handoff maps.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
