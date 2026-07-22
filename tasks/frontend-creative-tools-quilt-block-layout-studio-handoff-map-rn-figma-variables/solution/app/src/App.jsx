import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore.js';
import { setupWebMCP } from './webmcp/setup.js';
import { QuiltBlockSessionSchema, QuiltBlockRecordSchema } from './lib/schema.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo, Download, Upload, Trash2, Edit2, Check, X, AlertTriangle, Layers, UserCircle, Plus } from 'lucide-react';

function App() {
  const { records, derived, history, selectedId, selectRecord, addRecord, updateRecord, deleteRecord, undo, clearAll, setFullState } = useStore();

  useEffect(() => {
    setupWebMCP();
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [filterStatus, setFilterStatus] = useState('all');
  const [importError, setImportError] = useState(null);

  const handleExport = () => {
    const exportData = {
      schemaVersion: "quilt-layout-v1",
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quilt-layout-v1-handoff-map.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        const validData = QuiltBlockSessionSchema.parse(json);
        const ids = new Set();
        for (const r of validData.records) {
          if (ids.has(r.id)) throw new Error("Duplicate IDs not allowed");
          ids.add(r.id);
        }
        setFullState({
          records: validData.records,
          derived: validData.derived,
          history: validData.history
        });
        setImportError(null);
      } catch (err) {
        setImportError(err.message || "Invalid import file format");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditForm({ ...record });
    setFormErrors({});
  };

  const startCreate = () => {
    setEditingId('new');
    setEditForm({ id: crypto.randomUUID(), name: '', owner: '', readiness: 0, status: 'empty' });
    setFormErrors({});
  };

  const validateForm = (form) => {
    const result = QuiltBlockRecordSchema.safeParse(form);
    if (!result.success) {
      const errs = {};
      result.error.issues.forEach(iss => errs[iss.path[0]] = iss.message);
      return errs;
    }
    return {};
  };

  const handleFormChange = (updates) => {
    const newForm = { ...editForm, ...updates };
    setEditForm(newForm);
    setFormErrors(validateForm(newForm));
  };

  const saveEdit = () => {
    const errs = validateForm(editForm);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    if (editingId === 'new') {
      addRecord(editForm);
    } else {
      updateRecord(editForm.id, { name: editForm.name, owner: editForm.owner, readiness: editForm.readiness, status: editForm.status });
    }
    setEditingId(null);
    setEditForm(null);
    setFormErrors({});
  };

  const isFormValid = editForm && Object.keys(validateForm(editForm)).length === 0;

  const filteredRecords = records.filter(r => filterStatus === 'all' || r.status === filterStatus);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Sidebar: Derived Summary & Tools */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 flex flex-col shrink-0 h-auto md:h-screen overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-600"/> Quilt Block Studio</h1>
          <p className="text-sm text-slate-500 mt-1">Manage blocks & handoffs</p>
        </div>

        <div className="space-y-4 flex-1">
          <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
            <h2 className="text-sm font-semibold mb-2 uppercase tracking-wide text-slate-600">Summary</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Empty</span> <span>{derived.summary['empty'] || 0}</span></div>
              <div className="flex justify-between"><span>Draft</span> <span>{derived.summary['draft'] || 0}</span></div>
              <div className="flex justify-between"><span>Ready</span> <span>{derived.summary['ready'] || 0}</span></div>
              <div className="flex justify-between"><span>Changed</span> <span>{derived.summary['changed'] || 0}</span></div>
              <div className="flex justify-between"><span>Archived</span> <span>{derived.summary['archived'] || 0}</span></div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={undo} className="flex items-center gap-2 justify-center py-2 px-4 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium">
              <Undo className="w-4 h-4" /> Undo
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 justify-center py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium">
              <Download className="w-4 h-4" /> Export
            </button>
            <label className="flex items-center gap-2 justify-center py-2 px-4 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium cursor-pointer">
              <Upload className="w-4 h-4" /> Import
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button onClick={clearAll} className="flex items-center gap-2 justify-center py-2 px-4 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors shadow-sm text-sm font-medium">
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          </div>
          {importError && (
            <div className="p-2 bg-red-100 text-red-700 text-xs rounded border border-red-200">
              {importError}
            </div>
          )}
        </div>
      </aside>

      {/* Main Canvas: Handoff Map */}
      <main className="flex-1 p-4 md:p-8 bg-slate-50 h-auto md:h-screen overflow-y-auto relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Handoff Map</h2>
          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="p-1.5 border border-slate-300 rounded-md text-sm bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="empty">Empty</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
            <button
              onClick={startCreate}
              className="flex items-center gap-1 py-1.5 px-3 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Block
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {editingId === 'new' && editForm && (
              <motion.div
                layout={!reducedMotion}
                initial={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                animate={reducedMotion ? {} : { opacity: 1, scale: 1 }}
                exit={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                className="relative p-4 rounded-xl border-2 border-indigo-500 shadow-md ring-2 ring-indigo-200 ring-offset-1 bg-white"
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Name</label>
                    <input type="text" value={editForm.name} onChange={e => handleFormChange({ name: e.target.value })} className="w-full mt-1 p-1.5 border rounded text-sm"/>
                    {formErrors.name && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3"/>{formErrors.name}</span>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Owner</label>
                    <input type="text" value={editForm.owner} onChange={e => handleFormChange({ owner: e.target.value })} className="w-full mt-1 p-1.5 border rounded text-sm"/>
                    {formErrors.owner && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3"/>{formErrors.owner}</span>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Readiness (0-100)</label>
                    <input type="number" value={editForm.readiness} onChange={e => handleFormChange({ readiness: Number(e.target.value) })} className="w-full mt-1 p-1.5 border rounded text-sm"/>
                    {formErrors.readiness && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3"/>{formErrors.readiness}</span>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Status</label>
                    <select value={editForm.status} onChange={e => handleFormChange({ status: e.target.value })} className="w-full mt-1 p-1.5 border rounded text-sm">
                      <option value="empty">Empty</option>
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="changed">Changed</option>
                      <option value="archived">Archived</option>
                    </select>
                    {formErrors.status && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3"/>{formErrors.status}</span>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={saveEdit} disabled={!isFormValid} className="flex-1 bg-indigo-600 disabled:opacity-50 text-white p-1.5 rounded flex justify-center items-center gap-1 text-sm"><Check className="w-4 h-4"/> Save</button>
                    <button onClick={() => { setEditingId(null); setEditForm(null); }} className="flex-1 bg-slate-200 text-slate-800 p-1.5 rounded flex justify-center items-center gap-1 text-sm"><X className="w-4 h-4"/> Cancel</button>
                  </div>
                </div>
              </motion.div>
            )}

            {filteredRecords.map((record) => {
              const isSelected = selectedId === record.id;
              const isEditing = editingId === record.id;

              return (
                <motion.div
                  key={record.id}
                  layout={!reducedMotion}
                  initial={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                  animate={reducedMotion ? {} : { opacity: 1, scale: 1 }}
                  exit={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={`relative p-4 rounded-xl border-2 transition-shadow ${isSelected ? 'border-indigo-500 shadow-md ring-2 ring-indigo-200 ring-offset-1' : 'border-slate-200 shadow-sm hover:shadow bg-white'} ${record.status === 'archived' ? 'opacity-60 bg-slate-100' : 'bg-white'}`}
                  onClick={() => !isEditing && selectRecord(record.id)}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectRecord(record.id);
                    }
                  }}
                >
                  {isEditing ? (
                    <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Name</label>
                        <input type="text" value={editForm.name} onChange={e => handleFormChange({ name: e.target.value })} className="w-full mt-1 p-1.5 border rounded text-sm"/>
                        {formErrors.name && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3"/>{formErrors.name}</span>}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Owner</label>
                        <input type="text" value={editForm.owner} onChange={e => handleFormChange({ owner: e.target.value })} className="w-full mt-1 p-1.5 border rounded text-sm"/>
                        {formErrors.owner && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3"/>{formErrors.owner}</span>}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Readiness (0-100)</label>
                        <input type="number" value={editForm.readiness} onChange={e => handleFormChange({ readiness: Number(e.target.value) })} className="w-full mt-1 p-1.5 border rounded text-sm"/>
                        {formErrors.readiness && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3"/>{formErrors.readiness}</span>}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Status</label>
                        <select value={editForm.status} onChange={e => handleFormChange({ status: e.target.value })} className="w-full mt-1 p-1.5 border rounded text-sm">
                          <option value="empty">Empty</option>
                          <option value="draft">Draft</option>
                          <option value="ready">Ready</option>
                          <option value="changed">Changed</option>
                          <option value="archived">Archived</option>
                        </select>
                        {formErrors.status && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3"/>{formErrors.status}</span>}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={saveEdit} disabled={!isFormValid} className="flex-1 bg-indigo-600 disabled:opacity-50 text-white p-1.5 rounded flex justify-center items-center gap-1 text-sm"><Check className="w-4 h-4"/> Save</button>
                        <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-200 text-slate-800 p-1.5 rounded flex justify-center items-center gap-1 text-sm"><X className="w-4 h-4"/> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-800 truncate pr-2">{record.name}</h3>
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                          record.status === 'changed' ? 'bg-amber-100 text-amber-700' :
                          record.status === 'draft' ? 'bg-blue-100 text-blue-700' :
                          record.status === 'archived' ? 'bg-slate-200 text-slate-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {record.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-600 mb-3">
                        <UserCircle className="w-4 h-4" /> {record.owner}
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-1 overflow-hidden">
                        <motion.div
                          className="bg-indigo-500 h-2 rounded-full"
                          initial={reducedMotion ? false : { width: 0 }}
                          animate={{ width: `${record.readiness}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                      <div className="text-right text-xs text-slate-500 font-medium mb-3">
                        {record.readiness}% Ready
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity absolute top-2 right-2 hidden sm:flex">
                         {/* Only visible on hover on desktop, always there via actions below */}
                      </div>

                      {isSelected && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2 justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEdit(record); }}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            aria-label="Edit record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            aria-label="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {filteredRecords.length === 0 && editingId !== 'new' && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Layers className="w-12 h-12 mb-2 opacity-50" />
            <p>No quilt blocks found matching the current filter.</p>
          </div>
        )}
      </main>

      {/* Detail panel for selected on desktop / stack on mobile */}
      {selectedId && !editingId && (
        <aside className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-200 p-6 flex flex-col shrink-0 h-auto md:h-screen overflow-y-auto">
          <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
            Details
            <button onClick={() => selectRecord(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
          </h3>
          {records.find(r => r.id === selectedId) && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-sm font-medium text-slate-500 mb-1">Name</p>
                <p className="text-base font-semibold">{records.find(r => r.id === selectedId).name}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Quick Actions</p>
                <button
                  onClick={() => {
                    const r = records.find(r => r.id === selectedId);
                    updateRecord(r.id, { readiness: 100, status: 'ready' });
                  }}
                  className="w-full py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-sm font-medium hover:bg-emerald-100 transition-colors"
                >
                  Mark as Ready (100%)
                </button>
                <button
                  onClick={() => {
                    const r = records.find(r => r.id === selectedId);
                    startEdit(r);
                  }}
                  className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors"
                >
                  Edit Connection & Readiness
                </button>
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

export default App;
