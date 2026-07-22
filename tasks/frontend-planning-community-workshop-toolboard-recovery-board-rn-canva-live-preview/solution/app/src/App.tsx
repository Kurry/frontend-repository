import React, { useState, useEffect, } from 'react';
import { v4 as uuidv4 } from 'uuid';

type Status = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';
type RecoveryState = 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

interface Record {
  id: string;
  name: string;
  status: Status;
}

interface WorkshopToolboardSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: Record[];
  derived: {
    summary: string;
  };
  history: any[];
}

const App = () => {
  const [records, setRecords] = useState<Record[]>([
    { id: '1', name: 'Intro Setup', status: 'ready' },
    { id: '2', name: 'Failed Demo', status: 'draft' }
  ]);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('idle');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record[][]>([]);
  const [filter, setFilter] = useState<Status | 'all'>('all');

  const addRecord = (name: string, status: Status) => {
    setHistory(prev => [...prev, records]);
    setRecords([...records, { id: uuidv4(), name, status }]);
  };

  const updateRecord = (id: string, name: string, status: Status) => {
    setHistory(prev => [...prev, records]);
    setRecords(records.map(r => r.id === id ? { ...r, name, status } : r));
  };

  const deleteRecord = (id: string) => {
    setHistory(prev => [...prev, records]);
    setRecords(records.filter(r => r.id !== id));
  };

  const undo = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setRecords(prev);
      setHistory(history.slice(0, -1));
    }
  };

  const moveFailedToRecovery = (id: string) => {
    setHistory(prev => [...prev, records]);
    setRecords(records.map(r => r.id === id ? { ...r, status: 'changed' } : r));
    setRecoveryState('resolved');
  };

  const handleExport = () => {
    const session: WorkshopToolboardSession = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived: { summary: `${records.length} records` },
      history: []
    };
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workshop-toolboard-v1-recovery-board.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const session = JSON.parse(e.target?.result as string) as WorkshopToolboardSession;
          if (session.schemaVersion === 'v1' && Array.isArray(session.records)) {
             setRecords(session.records);
          }
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    (window as any).webmcp_session_info = {
      task: 'eval-intelligence/frontend-planning-community-workshop-toolboard-recovery-board-rn-canva-live-preview',
      contract_version: 'zto-webmcp-v1'
    };

    (window as any).webmcp_list_tools = () => {
      return [
        { name: 'entity_create_record', description: 'Create record' },
        { name: 'entity_update_record', description: 'Update record' },
        { name: 'entity_delete_record', description: 'Delete record' },
        { name: 'editor_update_property', description: 'Update property in editor' },
        { name: 'artifact_export_session_json', description: 'Export JSON' },
        { name: 'artifact_import_session_json', description: 'Import JSON' }
      ];
    };

    (window as any).webmcp_invoke_tool = (name: string, args: any) => {
      console.log('webmcp_invoke_tool', name, args);
      if (name === 'entity_create_record') {
        addRecord(args.name, args.status);
        return { success: true };
      }
      if (name === 'entity_update_record') {
        updateRecord(args.id, args.name, args.status);
        return { success: true };
      }
      if (name === 'entity_delete_record') {
        deleteRecord(args.id);
        return { success: true };
      }
      if (name === 'editor_update_property') {
        if (args.property === 'status' && args.value === 'changed') {
            moveFailedToRecovery(args.id);
            return { success: true };
        }
      }
      if (name === 'artifact_export_session_json') {
          handleExport();
          return { success: true };
      }
      return { success: false, error: 'unknown tool' };
    };
  }, [records, history]);

  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
         undo();
       }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-900 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b">
        <h1 className="text-2xl font-bold">Workshop Toolboard</h1>
        <div className="flex gap-2 mt-4 md:mt-0">
          <button onClick={undo} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Undo (Ctrl+Z)</button>
          <button onClick={handleExport} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Export JSON</button>
          <label className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer">
            Import JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <main className="md:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Stations Collection</h2>
              <select value={filter} onChange={e => setFilter(e.target.value as any)} className="border p-1 rounded">
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
                <option value="empty">Empty</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredRecords.map(r => (
                <div key={r.id} className={`p-4 border rounded flex justify-between items-center transition-all ${selectedRecordId === r.id ? 'ring-2 ring-blue-500' : ''}`}>
                  <div>
                    <h3 className="font-medium">{r.name}</h3>
                    <span className="text-sm text-gray-500">Status: {r.status}</span>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setSelectedRecordId(r.id)} className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Select</button>
                     <button onClick={() => deleteRecord(r.id)} className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                  </div>
                </div>
              ))}
              {filteredRecords.length === 0 && <p className="text-gray-500 italic">No records found.</p>}
            </div>

            <div className="mt-6 pt-6 border-t flex gap-2">
               <input type="text" id="new-record-name" placeholder="New record name" className="border p-2 rounded flex-1" />
               <button onClick={() => {
                 const el = document.getElementById('new-record-name') as HTMLInputElement;
                 if (el.value) { addRecord(el.value, 'draft'); el.value = ''; }
               }} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add</button>
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Recovery Board</h2>
            <div className="text-sm text-gray-600 mb-4">State: <span className="font-mono bg-gray-100 px-1 rounded">{recoveryState}</span></div>

            {selectedRecordId ? (
              <div className="space-y-4">
                <p>Selected ID: <span className="font-mono text-xs">{selectedRecordId.substring(0,8)}...</span></p>
                <button
                  onClick={() => moveFailedToRecovery(selectedRecordId)}
                  className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-transform active:scale-95"
                >
                  Move to Recovery & Repair
                </button>
              </div>
            ) : (
              <p className="text-gray-500 italic">Select a record to view recovery options.</p>
            )}
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Derived Summary</h2>
            <p>Total Records: {records.length}</p>
            <p>Ready: {records.filter(r => r.status === 'ready').length}</p>
            <p>Draft: {records.filter(r => r.status === 'draft').length}</p>
            <p>Changed: {records.filter(r => r.status === 'changed').length}</p>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default App;
