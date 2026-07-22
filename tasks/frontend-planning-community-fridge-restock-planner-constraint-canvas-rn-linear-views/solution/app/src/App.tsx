import React, { useState } from 'react';
import { TaskBoard } from './components/TaskBoard';
import { ExportDialog } from './components/ExportDialog';
import { useStore } from './store';
import { DomainState } from './types';

function App() {
  const { records, undo, undoHistory, addRecord, selectedRecordId, updateRecord } = useStore();
  const [showExport, setShowExport] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskQty, setNewTaskQty] = useState(1);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addRecord({ title: newTaskTitle, description: '', quantity: newTaskQty, status: 'draft' });
    setNewTaskTitle('');
    setNewTaskQty(1);
  };

  const selectedRecord = records.find(r => r.id === selectedRecordId);

  const derivedSummary = {
    total: records.length,
    empty: records.filter(r => r.status === 'empty').length,
    draft: records.filter(r => r.status === 'draft').length,
    ready: records.filter(r => r.status === 'ready').length,
    changed: records.filter(r => r.status === 'changed').length,
    archived: records.filter(r => r.status === 'archived').length,
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden text-gray-800 font-sans">
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0">
        <h1 className="text-xl font-bold tracking-tight">Community Fridge Restock Planner</h1>
        <div className="flex gap-4 items-center">
          <div className="text-sm font-mono bg-gray-100 px-3 py-1 rounded-md text-gray-600 border border-gray-200">
            Tasks: {derivedSummary.total} | D: {derivedSummary.draft} | R: {derivedSummary.ready} | C: {derivedSummary.changed}
          </div>
          <button
            onClick={undo}
            disabled={undoHistory.length === 0}
            className="px-4 py-2 border rounded-md text-sm font-medium disabled:opacity-50 hover:bg-gray-50 flex items-center gap-2"
          >
            <span>Undo</span>
            <kbd className="hidden sm:inline bg-gray-100 border text-xs px-1 rounded text-gray-500">Cmd+Z</kbd>
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800"
          >
            Export / Import
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Inspector / Creator */}
        <aside className="w-80 border-r bg-gray-50 p-4 flex flex-col gap-6 overflow-y-auto">
          <section className="bg-white p-4 rounded-lg border shadow-sm">
            <h2 className="font-semibold text-sm mb-3">Add Restock Task</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Title (max 40 chars)"
                maxLength={40}
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 w-16">Quantity:</label>
                <input
                  type="number"
                  min={0}
                  value={newTaskQty}
                  onChange={e => setNewTaskQty(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                  className="flex-1 text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded text-sm font-medium hover:bg-blue-700">Add to Drafts</button>
            </form>
          </section>

          {selectedRecord && (
            <section className="bg-white p-4 rounded-lg border shadow-sm border-blue-200">
              <h2 className="font-semibold text-sm mb-3 text-blue-800">Edit Selection</h2>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={selectedRecord.title}
                  maxLength={40}
                  onChange={e => updateRecord(selectedRecord.id, { title: e.target.value })}
                  className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <textarea
                  value={selectedRecord.description || ''}
                  onChange={e => updateRecord(selectedRecord.id, { description: e.target.value })}
                  placeholder="Description..."
                  className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 w-16">Qty:</label>
                  <input
                    type="number"
                    min={0}
                    value={selectedRecord.quantity}
                    onChange={e => updateRecord(selectedRecord.id, { quantity: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                    className="flex-1 text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </section>
          )}
        </aside>

        {/* Center Canvas */}
        <div className="flex-1 overflow-hidden relative" onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            e.preventDefault();
            undo();
          }
        }} tabIndex={-1}>
          <TaskBoard />
        </div>
      </main>

      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
    </div>
  );
}

export default App;
