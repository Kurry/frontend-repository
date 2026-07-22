import { useState, useEffect, useMemo } from 'react';
import { useStore } from './store';
import type { BrewExperimentRecord, ExperimentStatus } from './types';
import { Download, Upload, Trash2, Edit2, CheckCircle, AlertTriangle, Undo, Plus, Link as LinkIcon, Save, X } from 'lucide-react';
import './index.css';

function App() {
  const store = useStore();
  const { session, createRecord, updateRecord, deleteRecord, attachEvidence, importSession, clearSession, undo, canUndo } = store;

  const [filter, setFilter] = useState<ExperimentStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BrewExperimentRecord>>({});

  // Audit Lens state
  const [evidenceInput, setEvidenceInput] = useState('');

  // WebMCP Integration
  useEffect(() => {
    (window as any).webmcp_session_info = () => ({
      app_name: "Coffee Brew Experiment Log",
      contract_version: "zto-webmcp-v1",
      modules: ["entity-collection-v1", "artifact-transfer-v1"]
    });

    (window as any).webmcp_list_tools = () => [
      { name: "entity_create", description: "Create a new record" },
      { name: "entity_select", description: "Select a record" },
      { name: "entity_update", description: "Update a record" },
      { name: "entity_delete", description: "Delete a record" },
      { name: "artifact_export", description: "Export session" },
      { name: "artifact_import", description: "Import session" }
    ];

    (window as any).webmcp_invoke_tool = (name: string, args: any) => {
      try {
        switch (name) {
          case 'entity_create':
            createRecord(args);
            return { success: true };
          case 'entity_select':
            setSelectedId(args.id);
            return { success: true };
          case 'entity_update':
            if (args.evidence) {
              attachEvidence(args.id, args.evidence);
            } else {
              updateRecord(args.id, args);
            }
            return { success: true };
          case 'entity_delete':
            if (args.confirm) {
              deleteRecord(args.id);
              if (selectedId === args.id) setSelectedId(null);
              return { success: true };
            }
            return { success: false, error: 'confirm=true required' };
          case 'artifact_export':
            return { success: true, artifact: JSON.stringify(session) };
          case 'artifact_import':
            const ok = importSession(JSON.parse(args.artifact));
            return ok ? { success: true } : { success: false, error: 'invalid schema' };
          default:
            return { success: false, error: 'Unknown tool' };
        }
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    };
  }, [session, createRecord, updateRecord, deleteRecord, attachEvidence, importSession, selectedId]);

  // Derived filtered records
  const visibleRecords = useMemo(() => {
    if (filter === 'all') return session.records;
    return session.records.filter(r => r.status === filter);
  }, [session.records, filter]);

  const selectedRecord = useMemo(() => {
    return session.records.find(r => r.id === selectedId);
  }, [session.records, selectedId]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (canUndo) undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, undo]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brew-experiment-v1-audit-lens.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!importSession(parsed)) {
          alert('Invalid schema or bounds.');
        }
      } catch (err) {
        alert('Malformed JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const startEdit = (record?: BrewExperimentRecord) => {
    if (record) {
      setEditingId(record.id);
      setEditForm(record);
    } else {
      setEditingId('new');
      setEditForm({
        name: '',
        date: new Date().toISOString().split('T')[0],
        beanWeight: 15.0,
        waterWeight: 250.0,
        status: 'draft',
        evidence: ''
      });
    }
  };

  const saveEdit = () => {
    if (!editForm.name || !editForm.date) {
      alert('Name and Date are required. Previous valid state preserved.');
      return;
    }
    if (editForm.beanWeight! < 0.1 || editForm.beanWeight! > 100.0 || editForm.waterWeight! < 1.0 || editForm.waterWeight! > 2000.0) {
      alert('Values out of bounds (Bean: 0.1-100, Water: 1.0-2000). Previous valid state preserved.');
      return;
    }

    if (editingId === 'new') {
      createRecord(editForm as Omit<BrewExperimentRecord, 'id' | 'auditLensState'>);
    } else if (editingId) {
      updateRecord(editingId, editForm);
    }
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brew Experiments</h1>
          <p className="text-sm text-slate-500 mt-1">Audit Lens Workbench</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button onClick={undo} disabled={!canUndo} className="px-3 py-1.5 flex items-center gap-2 bg-white border border-slate-200 rounded text-sm hover:bg-slate-50 disabled:opacity-50" aria-label="Undo">
            <Undo size={16} /> Undo
          </button>
          <button onClick={handleExport} className="px-3 py-1.5 flex items-center gap-2 bg-white border border-slate-200 rounded text-sm hover:bg-slate-50">
            <Download size={16} /> Export
          </button>
          <label className="px-3 py-1.5 flex items-center gap-2 bg-white border border-slate-200 rounded text-sm hover:bg-slate-50 cursor-pointer">
            <Upload size={16} /> Import
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={clearSession} className="px-3 py-1.5 flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded text-sm hover:bg-red-100">
            <Trash2 size={16} /> Clear
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Collection */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
            <div className="flex gap-2">
              {(['all', 'draft', 'ready', 'changed', 'archived'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded text-sm font-medium capitalize ${filter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button onClick={() => startEdit()} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex items-center gap-2 hover:bg-blue-700">
              <Plus size={16} /> New Record
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {visibleRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p>No records found in this view.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <th className="p-3 font-medium">Name</th>
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium">Recipe</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRecords.map(record => (
                      <tr
                        key={record.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${selectedId === record.id ? 'bg-blue-50/50' : ''}`}
                        onClick={() => setSelectedId(record.id)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setSelectedId(record.id);
                        }}
                      >
                        <td className="p-3 font-medium text-sm">{record.name || 'Unnamed'}</td>
                        <td className="p-3 text-sm text-slate-600">{record.date}</td>
                        <td className="p-3 text-sm text-slate-600">{record.beanWeight}g : {record.waterWeight}g</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                            ${record.auditLensState === 'conflict' ? 'bg-amber-100 text-amber-800' :
                              record.auditLensState === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-slate-100 text-slate-800'}`}
                          >
                            {record.auditLensState === 'conflict' ? 'Discrepancy' : record.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={(e) => { e.stopPropagation(); startEdit(record); }} className="p-1 text-slate-400 hover:text-blue-600" aria-label="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) deleteRecord(record.id); }} className="p-1 text-slate-400 hover:text-red-600" aria-label="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Audit Lens & Inspector */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-blue-600" /> Derived Summary
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded">
                <div className="text-2xl font-semibold">{session.derived.summary.totalRecords}</div>
                <div className="text-xs text-slate-500 uppercase mt-1">Total</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded">
                <div className="text-2xl font-semibold text-emerald-700">{session.derived.summary.resolvedCount}</div>
                <div className="text-xs text-emerald-600 uppercase mt-1">Resolved</div>
              </div>
              <div className="p-3 bg-amber-50 rounded">
                <div className="text-2xl font-semibold text-amber-700">{session.derived.summary.conflictCount}</div>
                <div className="text-xs text-amber-600 uppercase mt-1">Conflicts</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex-1 border-t-4 border-t-blue-500">
            <h2 className="text-lg font-semibold mb-4">Audit Lens</h2>

            {!selectedRecord ? (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded">
                Select a record to inspect
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{selectedRecord.name}</h3>
                    <p className="text-sm text-slate-500">{selectedRecord.date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium uppercase
                    ${selectedRecord.auditLensState === 'conflict' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      selectedRecord.auditLensState === 'resolved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'}`}
                  >
                    {selectedRecord.auditLensState}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bean Weight:</span>
                    <span className="font-medium">{selectedRecord.beanWeight}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Water Weight:</span>
                    <span className="font-medium">{selectedRecord.waterWeight}g</span>
                  </div>
                </div>

                {selectedRecord.auditLensState === 'conflict' && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded text-sm text-amber-800 flex gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Missing Evidence</p>
                      <p className="mt-1">Provide an evidence link to resolve this discrepancy.</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Attach Evidence</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="https://..."
                      value={evidenceInput}
                      onChange={e => setEvidenceInput(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        if (!evidenceInput.trim()) {
                          alert('Cannot attach empty evidence.');
                          return;
                        }
                        attachEvidence(selectedRecord.id, evidenceInput);
                        setEvidenceInput('');
                      }}
                      className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm flex items-center gap-1 hover:bg-slate-700 disabled:opacity-50"
                      disabled={!evidenceInput.trim()}
                    >
                      <LinkIcon size={14} /> Attach
                    </button>
                  </div>
                </div>

                {selectedRecord.evidence && (
                  <div className="text-sm">
                    <span className="text-slate-500 mr-2">Attached:</span>
                    <a href={selectedRecord.evidence} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate inline-block max-w-[200px] align-bottom">
                      {selectedRecord.evidence}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingId !== null && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h3 className="font-semibold">{editingId === 'new' ? 'New Record' : 'Edit Record'}</h3>
              <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" value={editForm.date || ''} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bean Weight (g)</label>
                  <input type="number" step="0.1" value={editForm.beanWeight || ''} onChange={e => setEditForm({...editForm, beanWeight: parseFloat(e.target.value)})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Water Weight (g)</label>
                  <input type="number" step="1" value={editForm.waterWeight || ''} onChange={e => setEditForm({...editForm, waterWeight: parseFloat(e.target.value)})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={editForm.status || 'draft'} onChange={e => setEditForm({...editForm, status: e.target.value as ExperimentStatus})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="empty">Empty</option>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="changed">Changed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
              <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded">Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2">
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
