import React, { useState, useEffect } from 'react';
import { useAppState } from './useAppState';
import type { LessonBlock, DomainStatus } from './types';
import { ActionContract, ActionContractItem } from '@zto/webmcp-contracts';
import { ActionContract, ActionContractItem } from '@zto/webmcp-contracts';
import { ActionContract, ActionContractItem } from '@zto/webmcp-contracts';
import { ActionContract, ActionContractItem } from '@zto/webmcp-contracts';
import { ActionContract, ActionContractItem } from '@zto/webmcp-contracts';
import { ActionContract, ActionContractItem } from '@zto/webmcp-contracts';
import { ActionContract, ActionContractItem } from '@zto/webmcp-contracts';
import { ActionContract, ActionContractItem } from '@zto/webmcp-contracts';
import { ActionContract, ActionContractItem } from '@zto/webmcp-contracts';
import type { ActionContractConfig } from '@zto/webmcp-contracts';
import { Play, RotateCcw, Download, Upload, Plus, Trash2, Edit2, Save, X, AlertCircle } from 'lucide-react';

export default function App() {
  const {
    state,
    createRecord,
    updateRecord,
    deleteRecord,
    batchReconcile,
    undo,
    exportArtifact,
    importArtifact,
    clearSession
  } = useAppState();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LessonBlock>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<DomainStatus | 'all'>('all');

  useEffect(() => {
    // Expose WebMCP context
    const contract: ActionContractConfig = {
      name: "frontend-planning-classroom-lesson-arc-planner-batch-reconciler-rn-claude-session"
    };
    (window as any).webmcp_session_info = contract;

    (window as any).webmcp_list_tools = () => {
      return [
        {
          name: "entity_create_record",
          description: "Create a new lesson block record.",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              durationMinutes: { type: "number" },
              status: { type: "string", enum: ["draft", "ready", "changed", "archived"] }
            },
            required: ["title", "durationMinutes"]
          }
        },
        {
          name: "entity_update_record",
          description: "Update an existing lesson block record.",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              durationMinutes: { type: "number" },
              status: { type: "string", enum: ["draft", "ready", "changed", "archived"] }
            },
            required: ["id"]
          }
        },
        {
          name: "artifact_export_session_json",
          description: "Export the current artifact to lesson-arc-v1-batch-reconciler.json.",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "artifact_import_session_json",
          description: "Clear the session and import the provided JSON artifact.",
          inputSchema: {
            type: "object",
            properties: {
              artifact: { type: "object" }
            },
            required: ["artifact"]
          }
        }
      ];
    };

    (window as any).webmcp_invoke_tool = (name: string, args: any) => {
      if (name === "entity_create_record") {
        createRecord(args);
        return { result: "Success" };
      } else if (name === "entity_update_record") {
        const { id, ...updates } = args;
        updateRecord(id, updates);
        return { result: "Success" };
      } else if (name === "artifact_export_session_json") {
        const data = exportArtifact();
        return { result: data };
      } else if (name === "artifact_import_session_json") {
        clearSession();
        importArtifact(args.artifact);
        return { result: "Success" };
      }
      throw new Error(`Unknown tool: ${name}`);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [createRecord, updateRecord, exportArtifact, clearSession, importArtifact, undo]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchReconcile = () => {
    if (selectedIds.size === 0) return;
    batchReconcile(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleSaveEdit = () => {
    if (!editForm.title || !editForm.durationMinutes || editForm.durationMinutes < 1) {
      setErrorMsg("Invalid required fields: Title is required and Duration must be >= 1");
      return;
    }
    setErrorMsg(null);
    if (isCreating) {
      createRecord(editForm);
      setIsCreating(false);
    } else if (editingId) {
      updateRecord(editingId, editForm);
      setEditingId(null);
    }
    setEditForm({});
  };

  const handleExport = () => {
    const data = exportArtifact();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lesson-arc-v1-batch-reconciler.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        importArtifact(data);
      } catch (err) {
        setErrorMsg("Malformed import file");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredRecords = state.records.filter(r => filterStatus === 'all' || r.status === filterStatus);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6">

      {/* Primary Surface */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-semibold">Classroom Lesson Arc Planner</h1>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
            >
              <Download size={16} /> Export
            </button>
            <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer">
              <Upload size={16} /> Import
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button
              onClick={undo}
              disabled={state.history.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-md transition-colors"
            >
              <RotateCcw size={16} /> Undo
            </button>
          </div>
        </header>

        {errorMsg && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)}><X size={18} /></button>
          </div>
        )}

        <div className="flex justify-between items-center bg-slate-800 p-4 rounded-lg">
          <div className="flex gap-2 items-center overflow-x-auto pb-1 md:pb-0">
            <span className="text-sm text-slate-400">Filter:</span>
            {['all', 'draft', 'ready', 'changed', 'archived'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-3 py-1 text-sm rounded-full capitalize ${filterStatus === status ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                {status}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setIsCreating(true); setEditForm({ status: 'draft', durationMinutes: 30 }); setEditingId(null); setErrorMsg(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors flex-shrink-0"
          >
            <Plus size={16} /> New Block
          </button>
        </div>

        <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="border-b border-slate-700 text-sm text-slate-400">
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      className="rounded bg-slate-900 border-slate-600 accent-indigo-600 h-4 w-4"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(new Set(filteredRecords.map(r => r.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                      checked={filteredRecords.length > 0 && selectedIds.size === filteredRecords.length}
                    />
                  </th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No lesson blocks found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(record => {
                    const isEditing = editingId === record.id;
                    const isSelected = selectedIds.has(record.id);

                    return (
                      <tr
                        key={record.id}
                        className={`border-b border-slate-700/50 transition-colors ${isSelected ? 'bg-indigo-900/20' : 'hover:bg-slate-750'} motion-safe:transition-all motion-reduce:transition-none`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            className="rounded bg-slate-900 border-slate-600 accent-indigo-600 h-4 w-4 cursor-pointer"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(record.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleToggleSelect(record.id);
                              }
                            }}
                          />
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.title || ''}
                              onChange={e => setEditForm({...editForm, title: e.target.value})}
                              className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-full"
                            />
                          ) : (
                            <div className="font-medium flex items-center gap-2">
                              {record.title}
                              {record.batchId && <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded uppercase">Batched</span>}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editForm.durationMinutes || ''}
                              onChange={e => setEditForm({...editForm, durationMinutes: parseInt(e.target.value)})}
                              className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-20"
                            />
                          ) : (
                            <span className="text-slate-300">{record.durationMinutes}m</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <select
                              value={editForm.status || 'draft'}
                              onChange={e => setEditForm({...editForm, status: e.target.value as DomainStatus})}
                              className="bg-slate-900 border border-slate-600 rounded px-2 py-1"
                            >
                              <option value="draft">Draft</option>
                              <option value="ready">Ready</option>
                              <option value="changed">Changed</option>
                              <option value="archived">Archived</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                              record.status === 'draft' ? 'bg-slate-600' :
                              record.status === 'ready' ? 'bg-emerald-600' :
                              record.status === 'changed' ? 'bg-amber-600' : 'bg-red-900/50 text-red-300'
                            }`}>
                              {record.status}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={handleSaveEdit} className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded"><Save size={16}/></button>
                              <button onClick={() => { setEditingId(null); setEditForm({}); setErrorMsg(null); }} className="p-1.5 text-slate-400 hover:bg-slate-700 rounded"><X size={16}/></button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => { setEditingId(record.id); setEditForm(record); setIsCreating(false); setErrorMsg(null); }}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                              ><Edit2 size={16}/></button>
                              <button
                                onClick={() => deleteRecord(record.id)}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                              ><Trash2 size={16}/></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
                {isCreating && (
                  <tr className="border-b border-slate-700/50 bg-indigo-900/10">
                    <td className="p-3"></td>
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="Lesson title..."
                        value={editForm.title || ''}
                        onChange={e => setEditForm({...editForm, title: e.target.value})}
                        className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-full"
                        autoFocus
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={editForm.durationMinutes || ''}
                        onChange={e => setEditForm({...editForm, durationMinutes: parseInt(e.target.value)})}
                        className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-20"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={editForm.status || 'draft'}
                        onChange={e => setEditForm({...editForm, status: e.target.value as DomainStatus})}
                        className="bg-slate-900 border border-slate-600 rounded px-2 py-1"
                      >
                        <option value="draft">Draft</option>
                        <option value="ready">Ready</option>
                        <option value="changed">Changed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={handleSaveEdit} className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded"><Save size={16}/></button>
                        <button onClick={() => { setIsCreating(false); setEditForm({}); setErrorMsg(null); }} className="p-1.5 text-slate-400 hover:bg-slate-700 rounded"><X size={16}/></button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile view */}
          <div className="md:hidden flex flex-col gap-4 p-4">
            {filteredRecords.map(record => {
              const isSelected = selectedIds.has(record.id);
              return (
                <div key={record.id} className={`p-4 rounded-lg border ${isSelected ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-slate-800'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="rounded bg-slate-900 border-slate-600 accent-indigo-600 h-5 w-5"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(record.id)}
                      />
                      <div className="font-medium">{record.title}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                      record.status === 'draft' ? 'bg-slate-600' :
                      record.status === 'ready' ? 'bg-emerald-600' :
                      record.status === 'changed' ? 'bg-amber-600' : 'bg-red-900/50 text-red-300'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 pl-8">
                    {record.durationMinutes}m
                    {record.batchId && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded uppercase">Batched</span>}
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => { setEditingId(record.id); setEditForm(record); setIsCreating(false); setErrorMsg(null); }}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                    ><Edit2 size={16}/></button>
                    <button
                      onClick={() => deleteRecord(record.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                    ><Trash2 size={16}/></button>
                  </div>
                </div>
              );
            })}
          </div>


      {/* Mobile view */}
      <div className="md:hidden flex flex-col gap-4 p-4 w-full">
        {filteredRecords.map(record => {
          const isSelected = selectedIds.has(record.id);
          return (
            <div key={record.id} className={`p-4 rounded-lg border ${isSelected ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-slate-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="rounded bg-slate-900 border-slate-600 accent-indigo-600 h-5 w-5"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(record.id)}
                  />
                  <div className="font-medium">{record.title}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                  record.status === 'draft' ? 'bg-slate-600' :
                  record.status === 'ready' ? 'bg-emerald-600' :
                  record.status === 'changed' ? 'bg-amber-600' : 'bg-red-900/50 text-red-300'
                }`}>
                  {record.status}
                </span>
              </div>
              <div className="text-sm text-slate-400 pl-8">
                {record.durationMinutes}m
                {record.batchId && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded uppercase">Batched</span>}
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => { setEditingId(record.id); setEditForm(record); setIsCreating(false); setErrorMsg(null); }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                ><Edit2 size={16}/></button>
                <button
                  onClick={() => deleteRecord(record.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                ><Trash2 size={16}/></button>
              </div>
            </div>
          );
        })}
      </div>


      {/* Mobile view */}
      <div className="md:hidden flex flex-col gap-4 p-4 w-full">
        {filteredRecords.map(record => {
          const isSelected = selectedIds.has(record.id);
          return (
            <div key={record.id} className={`p-4 rounded-lg border ${isSelected ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-slate-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="rounded bg-slate-900 border-slate-600 accent-indigo-600 h-5 w-5"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(record.id)}
                  />
                  <div className="font-medium">{record.title}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                  record.status === 'draft' ? 'bg-slate-600' :
                  record.status === 'ready' ? 'bg-emerald-600' :
                  record.status === 'changed' ? 'bg-amber-600' : 'bg-red-900/50 text-red-300'
                }`}>
                  {record.status}
                </span>
              </div>
              <div className="text-sm text-slate-400 pl-8">
                {record.durationMinutes}m
                {record.batchId && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded uppercase">Batched</span>}
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => { setEditingId(record.id); setEditForm(record); setIsCreating(false); setErrorMsg(null); }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                ><Edit2 size={16}/></button>
                <button
                  onClick={() => deleteRecord(record.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                ><Trash2 size={16}/></button>
              </div>
            </div>
          );
        })}
      </div>


      {/* Mobile view */}
      <div className="md:hidden flex flex-col gap-4 p-4 w-full">
        {filteredRecords.map(record => {
          const isSelected = selectedIds.has(record.id);
          return (
            <div key={record.id} className={`p-4 rounded-lg border ${isSelected ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-slate-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="rounded bg-slate-900 border-slate-600 accent-indigo-600 h-5 w-5"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(record.id)}
                  />
                  <div className="font-medium">{record.title}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                  record.status === 'draft' ? 'bg-slate-600' :
                  record.status === 'ready' ? 'bg-emerald-600' :
                  record.status === 'changed' ? 'bg-amber-600' : 'bg-red-900/50 text-red-300'
                }`}>
                  {record.status}
                </span>
              </div>
              <div className="text-sm text-slate-400 pl-8">
                {record.durationMinutes}m
                {record.batchId && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded uppercase">Batched</span>}
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => { setEditingId(record.id); setEditForm(record); setIsCreating(false); setErrorMsg(null); }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                ><Edit2 size={16}/></button>
                <button
                  onClick={() => deleteRecord(record.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                ><Trash2 size={16}/></button>
              </div>
            </div>
          );
        })}
      </div>


      {/* Mobile view */}
      <div className="md:hidden flex flex-col gap-4 p-4 w-full">
        {filteredRecords.map(record => {
          const isSelected = selectedIds.has(record.id);
          return (
            <div key={record.id} className={`p-4 rounded-lg border ${isSelected ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-slate-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="rounded bg-slate-900 border-slate-600 accent-indigo-600 h-5 w-5"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(record.id)}
                  />
                  <div className="font-medium">{record.title}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                  record.status === 'draft' ? 'bg-slate-600' :
                  record.status === 'ready' ? 'bg-emerald-600' :
                  record.status === 'changed' ? 'bg-amber-600' : 'bg-red-900/50 text-red-300'
                }`}>
                  {record.status}
                </span>
              </div>
              <div className="text-sm text-slate-400 pl-8">
                {record.durationMinutes}m
                {record.batchId && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded uppercase">Batched</span>}
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => { setEditingId(record.id); setEditForm(record); setIsCreating(false); setErrorMsg(null); }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                ><Edit2 size={16}/></button>
                <button
                  onClick={() => deleteRecord(record.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                ><Trash2 size={16}/></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile view */}
      <div className="md:hidden flex flex-col gap-4 p-4 w-full">
        {filteredRecords.map(record => {
          const isSelected = selectedIds.has(record.id);
          return (
            <div key={record.id} className={`p-4 rounded-lg border ${isSelected ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-slate-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="rounded bg-slate-900 border-slate-600 accent-indigo-600 h-5 w-5"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(record.id)}
                  />
                  <div className="font-medium">{record.title}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                  record.status === 'draft' ? 'bg-slate-600' :
                  record.status === 'ready' ? 'bg-emerald-600' :
                  record.status === 'changed' ? 'bg-amber-600' : 'bg-red-900/50 text-red-300'
                }`}>
                  {record.status}
                </span>
              </div>
              <div className="text-sm text-slate-400 pl-8">
                {record.durationMinutes}m
                {record.batchId && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded uppercase">Batched</span>}
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => { setEditingId(record.id); setEditForm(record); setIsCreating(false); setErrorMsg(null); }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                ><Edit2 size={16}/></button>
                <button
                  onClick={() => deleteRecord(record.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                ><Trash2 size={16}/></button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Mobile view */}
      <div className="md:hidden flex flex-col gap-4 p-4 w-full">
        {filteredRecords.map(record => {
          const isSelected = selectedIds.has(record.id);
          return (
            <div key={record.id} className={`p-4 rounded-lg border ${isSelected ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-slate-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="rounded bg-slate-900 border-slate-600 accent-indigo-600 h-5 w-5"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(record.id)}
                  />
                  <div className="font-medium">{record.title}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                  record.status === 'draft' ? 'bg-slate-600' :
                  record.status === 'ready' ? 'bg-emerald-600' :
                  record.status === 'changed' ? 'bg-amber-600' : 'bg-red-900/50 text-red-300'
                }`}>
                  {record.status}
                </span>
              </div>
              <div className="text-sm text-slate-400 pl-8">
                {record.durationMinutes}m
                {record.batchId && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded uppercase">Batched</span>}
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => { setEditingId(record.id); setEditForm(record); setIsCreating(false); setErrorMsg(null); }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                ><Edit2 size={16}/></button>
                <button
                  onClick={() => deleteRecord(record.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                ><Trash2 size={16}/></button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Mobile view */}
      <div className="md:hidden flex flex-col gap-4 p-4 w-full">
        {filteredRecords.map(record => {
          const isSelected = selectedIds.has(record.id);
          return (
            <div key={record.id} className={`p-4 rounded-lg border ${isSelected ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-slate-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="rounded bg-slate-900 border-slate-600 accent-indigo-600 h-5 w-5"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(record.id)}
                  />
                  <div className="font-medium">{record.title}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                  record.status === 'draft' ? 'bg-slate-600' :
                  record.status === 'ready' ? 'bg-emerald-600' :
                  record.status === 'changed' ? 'bg-amber-600' : 'bg-red-900/50 text-red-300'
                }`}>
                  {record.status}
                </span>
              </div>
              <div className="text-sm text-slate-400 pl-8">
                {record.durationMinutes}m
                {record.batchId && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded uppercase">Batched</span>}
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => { setEditingId(record.id); setEditForm(record); setIsCreating(false); setErrorMsg(null); }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                ><Edit2 size={16}/></button>
                <button
                  onClick={() => deleteRecord(record.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                ><Trash2 size={16}/></button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Mobile view */}
      <div className="md:hidden flex flex-col gap-4 p-4 w-full">
        {filteredRecords.map(record => {
          const isSelected = selectedIds.has(record.id);
          return (
            <div key={record.id} className={`p-4 rounded-lg border ${isSelected ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-slate-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="rounded bg-slate-900 border-slate-600 accent-indigo-600 h-5 w-5"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(record.id)}
                  />
                  <div className="font-medium">{record.title}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                  record.status === 'draft' ? 'bg-slate-600' :
                  record.status === 'ready' ? 'bg-emerald-600' :
                  record.status === 'changed' ? 'bg-amber-600' : 'bg-red-900/50 text-red-300'
                }`}>
                  {record.status}
                </span>
              </div>
              <div className="text-sm text-slate-400 pl-8">
                {record.durationMinutes}m
                {record.batchId && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded uppercase">Batched</span>}
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => { setEditingId(record.id); setEditForm(record); setIsCreating(false); setErrorMsg(null); }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                ><Edit2 size={16}/></button>
                <button
                  onClick={() => deleteRecord(record.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                ><Trash2 size={16}/></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Linked Summary & Batch Reconciler Panel */}
      <div className="w-full md:w-80 flex flex-col gap-4">

        <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Play size={18} className="text-indigo-400" /> Batch Reconciler
          </h2>

          <div className="bg-slate-900/50 p-4 rounded-md mb-4">
            <div className="text-sm text-slate-400 mb-1">Selected Blocks</div>
            <div className="text-3xl font-light">{selectedIds.size}</div>

            {selectedIds.size > 0 && (
              <div className="mt-2 text-sm text-indigo-300">
                Total duration: {
                  Array.from(selectedIds).reduce((sum, id) => {
                    const record = state.records.find(r => r.id === id);
                    return sum + (record?.durationMinutes || 0);
                  }, 0)
                }m
              </div>
            )}
          </div>

          <button
            onClick={handleBatchReconcile}
            disabled={selectedIds.size === 0}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-md transition-colors font-medium"
          >
            Group & Reconcile Batch
          </button>

          <p className="text-xs text-slate-400 mt-3 text-center">
            Select records to group them into a single reconciled batch and aggregate totals.
          </p>
        </div>

        <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex-1">
          <h2 className="font-semibold mb-4">Session Ledger Summary</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-400">Total Blocks</span>
              <span className="font-medium">{state.derived.summary.totalBlocks}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-400">Total Duration</span>
              <span className="font-medium">{state.derived.summary.totalDuration}m</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-400">Batched Blocks</span>
              <span className="font-medium">{state.derived.summary.batchedBlocks}</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-slate-400">Save Health</span>
              <span className="font-medium text-emerald-400 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div> Sync
              </span>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-slate-400 mb-2">History Events ({state.history.length})</h3>
            <div className="max-h-40 overflow-y-auto space-y-2 text-xs">
              {state.history.slice().reverse().map((h, i) => (
                <div key={i} className="flex justify-between p-2 bg-slate-900 rounded">
                  <span className="text-indigo-300">{h.action}</span>
                  <span className="text-slate-500">{new Date(h.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
        <div className="mt-8">
          <ActionContract>
            <ActionContractItem name="entity_create_record" />
            <ActionContractItem name="entity_update_record" />
            <ActionContractItem name="artifact_export_session_json" />
            <ActionContractItem name="artifact_import_session_json" />
          </ActionContract>
        </div>
      </div>
        <div className="mt-8">
          <ActionContract>
            <ActionContractItem name="entity_create_record" />
            <ActionContractItem name="entity_update_record" />
            <ActionContractItem name="artifact_export_session_json" />
            <ActionContractItem name="artifact_import_session_json" />
          </ActionContract>
        </div>
      </div>
      <div className="mt-8">
        <ActionContract>
          <ActionContractItem name="entity_create_record" />
          <ActionContractItem name="entity_update_record" />
          <ActionContractItem name="artifact_export_session_json" />
          <ActionContractItem name="artifact_import_session_json" />
        </ActionContract>
        <div className="mt-8">
          <ActionContract>
            <ActionContractItem name="entity_create_record" />
            <ActionContractItem name="entity_update_record" />
            <ActionContractItem name="artifact_export_session_json" />
            <ActionContractItem name="artifact_import_session_json" />
          </ActionContract>
        </div>
      </div>

    </div>
  );
}