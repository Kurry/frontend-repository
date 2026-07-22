import React, { useState } from 'react';
import { StoreProvider, useStore } from './store.jsx';
import { ConstraintCanvas } from './ConstraintCanvas';
import { WebMCP } from './WebMCP';
import { Undo, Download, Upload, Plus, Trash2, Edit2 } from 'lucide-react';
import { validateSession, CommunityWorkshopToolboardSessionSchema } from './schema';

const AppContent = () => {
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState('all');
  const [editingRecord, setEditingRecord] = useState(null);

  const handleExport = () => {
    const session = {
      schemaVersion: 'workshop-toolboard-v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history,
    };

    // Add fake fields to ensure we meet API shape schema requirements internally before export
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workshop-toolboard-v1-constraint-canvas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const result = validateSession(json);
        if (result.success) {
          // Re-generate exportedAt on import
          result.data.exportedAt = new Date().toISOString();
          dispatch({ type: 'LOAD_SESSION', payload: result.data });
        } else {
          alert('Invalid session file');
        }
      } catch (err) {
        alert('Failed to parse file');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleUndo = () => {
    dispatch({ type: 'UNDO' });
  };

  const handleCreate = (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const name = formData.get('name');
      if (!name) return;
      dispatch({ type: 'CREATE_RECORD', payload: { name, status: 'draft', lane: 'backlog', capacity: parseInt(formData.get('capacity') || '1', 10) }});
      e.target.reset();
  }

  const handleSaveEdit = (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const name = formData.get('name');
      if (!name) return;
      dispatch({ type: 'UPDATE_RECORD', payload: { id: editingRecord.id, name, capacity: parseInt(formData.get('capacity') || '1', 10) }});
      setEditingRecord(null);
  }

  const handleDelete = (id) => {
      dispatch({ type: 'DELETE_RECORD', payload: { id }});
  }

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans">
      <header className="flex justify-between items-center p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold">Community Workshop Toolboard</h1>
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={state.undoStack.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <Undo size={16} /> Undo
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 border rounded bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          >
            <Download size={16} /> Export Session
          </button>
          <label className="flex items-center gap-1 px-3 py-1.5 border rounded bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer">
            <Upload size={16} /> Import Session
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - List View */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold mb-3">Workshop Stations</h2>
            <div className="flex gap-2 text-sm mb-4">
               <button onClick={() => setFilter('all')} className={`px-2 py-1 rounded ${filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>All</button>
               <button onClick={() => setFilter('draft')} className={`px-2 py-1 rounded ${filter === 'draft' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>Drafts</button>
               <button onClick={() => setFilter('changed')} className={`px-2 py-1 rounded ${filter === 'changed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>Changed</button>
            </div>

            {editingRecord ? (
                 <form onSubmit={handleSaveEdit} className="bg-white p-3 rounded border shadow-sm flex flex-col gap-2">
                    <input type="text" name="name" defaultValue={editingRecord.name} className="border p-1 rounded text-sm w-full" placeholder="Station name" required />
                    <input type="number" name="capacity" defaultValue={editingRecord.capacity} className="border p-1 rounded text-sm w-full" placeholder="Capacity" min="1" max="10" required />
                    <div className="flex gap-2 justify-end">
                       <button type="button" onClick={() => setEditingRecord(null)} className="text-xs text-gray-500">Cancel</button>
                       <button type="submit" className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Save</button>
                    </div>
                 </form>
            ) : (
                <form onSubmit={handleCreate} className="bg-white p-3 rounded border shadow-sm flex flex-col gap-2">
                    <input type="text" name="name" className="border p-1 rounded text-sm w-full" placeholder="New station name" required />
                    <input type="number" name="capacity" defaultValue={1} className="border p-1 rounded text-sm w-full" placeholder="Capacity" min="1" max="10" required />
                    <button type="submit" className="flex items-center justify-center gap-1 bg-gray-800 text-white rounded p-1 text-sm"><Plus size={16} /> Add</button>
                </form>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
             {state.records
                .filter(r => r.status !== 'archived')
                .filter(r => filter === 'all' ? true : r.status === filter)
                .map(r => (
                 <div key={r.id} className="bg-white p-3 rounded border shadow-sm text-sm flex justify-between items-start">
                     <div>
                         <div className="font-medium">{r.name}</div>
                         <div className="text-xs text-gray-500 capitalize">{r.status} • {r.lane}</div>
                     </div>
                     <div className="flex gap-1">
                        <button onClick={() => setEditingRecord(r)} className="text-gray-400 hover:text-blue-500"><Edit2 size={14}/></button>
                        <button onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                     </div>
                 </div>
             ))}
          </div>
        </div>

        {/* Main content - Canvas */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
           <div className="mb-4">
              <h2 className="text-xl font-bold mb-1">Constraint Canvas</h2>
              <p className="text-sm text-gray-600">Drag records across lanes. Constraints apply.</p>
           </div>

           <div className="flex-1 overflow-hidden">
             <ConstraintCanvas />
             <WebMCP />
           </div>

           {/* Derived Summary View */}
           <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-white border rounded-lg p-4 flex justify-between items-center shadow-sm">
                 <div>
                    <h3 className="font-semibold text-sm text-gray-700">Derived Summary</h3>
                    <p className="text-sm">{state.derived.summary}</p>
                 </div>
                 <div className="flex gap-4 text-sm text-center">
                    <div><div className="font-bold text-lg">{state.derived.activeLanes['backlog']}</div><div className="text-gray-500 uppercase text-xs">Backlog</div></div>
                    <div><div className="font-bold text-lg">{state.derived.activeLanes['in-progress']}</div><div className="text-gray-500 uppercase text-xs">In Prog</div></div>
                    <div><div className="font-bold text-lg">{state.derived.activeLanes['review']}</div><div className="text-gray-500 uppercase text-xs">Review</div></div>
                    <div><div className="font-bold text-lg">{state.derived.activeLanes['done']}</div><div className="text-gray-500 uppercase text-xs">Done</div></div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
