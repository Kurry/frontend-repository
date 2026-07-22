import React, { useState, useEffect } from 'react';
import { Plus, X, Upload, Download, Undo, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';

const TOTAL_CAPACITY = 1000;

type Status = 'draft' | 'ready' | 'changed' | 'archived';

interface Record {
  id: string;
  name: string;
  status: Status;
  capacity: number;
}

interface Derived {
  totalCapacity: number;
  usedCapacity: number;
  remainingCapacity: number;
}

interface HistoryItem {
  id: string;
  action: string;
  timestamp: string;
  previousState: any;
}

interface Session {
  schemaVersion: 'v1';
  exportedAt: string;
  records: Record[];
  derived: Derived;
  history: HistoryItem[];
}

declare global {
  interface Window {
    webmcp_session_info?: () => Promise<{ task_id: string }>;
    webmcp_list_tools?: () => Promise<{ tools: any[] }>;
    webmcp_invoke_tool?: (request: { tool_name: string; arguments: any }) => Promise<{ success: boolean; result?: any; error?: string }>;
  }
}

export default function App() {
  const [records, setRecords] = useState<Record[]>([
    { id: '1', name: 'Milk Restock', status: 'draft', capacity: 20 },
    { id: '2', name: 'Veggie Surplus', status: 'ready', capacity: 50 },
    { id: '3', name: 'Canned Goods', status: 'archived', capacity: 10 },
  ]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Status | 'all'>('all');

  const [composerRecords, setComposerRecords] = useState<Record[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Record>>({});
  const [editError, setEditError] = useState<string | null>(null);

  const usedCapacity = composerRecords.reduce((sum, r) => sum + r.capacity, 0);
  const remainingCapacity = TOTAL_CAPACITY - usedCapacity;

  const derived: Derived = {
    totalCapacity: TOTAL_CAPACITY,
    usedCapacity,
    remainingCapacity,
  };

  const getFilteredRecords = () => {
    if (filter === 'all') return records;
    return records.filter((r) => r.status === filter);
  };

  const saveHistory = (action: string, previousState: any) => {
    setHistory(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        action,
        timestamp: new Date().toISOString(),
        previousState
      }
    ]);
  };

  const handleCreate = (record: Record) => {
    const prevState = { records, composerRecords };
    setRecords(prev => [...prev, record]);
    saveHistory('create', prevState);
  };

  const handleUpdate = (record: Record) => {
    const prevState = { records, composerRecords };
    setRecords(prev => prev.map(r => r.id === record.id ? record : r));
    setComposerRecords(prev => prev.map(r => r.id === record.id ? record : r));
    saveHistory('update', prevState);
  };

  const handleDelete = (id: string) => {
    const prevState = { records, composerRecords };
    setRecords(prev => prev.filter(r => r.id !== id));
    setComposerRecords(prev => prev.filter(r => r.id !== id));
    if (selectedRecordId === id) setSelectedRecordId(null);
    saveHistory('delete', prevState);
  };

  const handleSelect = (id: string | null) => {
    setSelectedRecordId(id);
  };

  const handlePlaceInComposer = () => {
    if (!selectedRecordId) return;

    const record = records.find(r => r.id === selectedRecordId);
    if (!record) return;

    if (record.capacity > remainingCapacity) {
      alert("Capacity exceeds limit. Cannot place item.");
      return;
    }

    if (composerRecords.some(r => r.id === record.id)) {
      return;
    }

    const prevState = { records, composerRecords, selectedRecordId };

    const updatedRecord = { ...record, status: 'ready' as Status };
    setRecords(prev => prev.map(r => r.id === record.id ? updatedRecord : r));
    setComposerRecords(prev => [...prev, updatedRecord]);

    saveHistory('place_in_composer', prevState);
  };

  const handleRemoveFromComposer = (id: string) => {
    const prevState = { records, composerRecords };
    setComposerRecords(prev => prev.filter(r => r.id !== id));
    saveHistory('remove_from_composer', prevState);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];
    setRecords(lastAction.previousState.records);
    setComposerRecords(lastAction.previousState.composerRecords);
    if (lastAction.previousState.selectedRecordId !== undefined) {
      setSelectedRecordId(lastAction.previousState.selectedRecordId);
    }
    setHistory(prev => prev.slice(0, -1));
  };

  const handleExport = () => {
    const session: Session = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history,
    };
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fridge-restock-v1-spatial-composer.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as Session;

        // Basic validation
        if (json.schemaVersion !== 'v1') throw new Error('Invalid schema version');
        if (!Array.isArray(json.records)) throw new Error('Invalid records');

        // Validate records
        for (const r of json.records) {
          if (typeof r.id !== 'string' || typeof r.name !== 'string' || typeof r.capacity !== 'number') {
            throw new Error('Invalid record format');
          }
          if (r.capacity < 1 || r.capacity > 100) {
            throw new Error('Capacity must be between 1 and 100');
          }
          if (!['draft', 'ready', 'changed', 'archived'].includes(r.status)) {
            throw new Error('Invalid status');
          }
        }

        // Ensure unique IDs
        const ids = new Set(json.records.map(r => r.id));
        if (ids.size !== json.records.length) throw new Error('Duplicate IDs found');

        // Apply state
        setRecords(json.records);
        setHistory(json.history || []);

        const placed = json.records.filter(r => r.status === 'ready' || r.status === 'changed');
        setComposerRecords(placed);
        setSelectedRecordId(null);
        alert('Import successful');

      } catch (err) {
        console.error(err);
        alert('Malformed import. No state change made.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const submitEdit = () => {
    if (!editForm.name || editForm.name.trim() === '') {
      setEditError("Name is required");
      return;
    }
    if (editForm.capacity === undefined || editForm.capacity < 1 || editForm.capacity > 100) {
      setEditError("Capacity must be between 1 and 100");
      return;
    }

    if (editForm.id) {
      handleUpdate(editForm as Record);
    } else {
      handleCreate({
        ...editForm,
        id: crypto.randomUUID(),
        status: editForm.status || 'draft'
      } as Record);
    }

    setIsEditing(false);
    setEditForm({});
    setEditError(null);
  };

  const openEdit = (record?: Record) => {
    if (record) {
      setEditForm(record);
    } else {
      setEditForm({ name: '', capacity: 10, status: 'draft' });
    }
    setEditError(null);
    setIsEditing(true);
  };


  // WebMCP Integration
  useEffect(() => {
    window.webmcp_session_info = async () => ({
      task_id: 'eval-intelligence/frontend-planning-community-fridge-restock-planner-spatial-composer-rn-provenance-artifact',
    });

    window.webmcp_list_tools = async () => ({
      tools: [
        {
          name: 'entity_create_record',
          description: 'Create a new restock task',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              capacity: { type: 'number' },
              status: { type: 'string' }
            },
            required: ['name', 'capacity']
          }
        },
        {
          name: 'entity_update_record',
          description: 'Update a restock task',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              capacity: { type: 'number' },
              status: { type: 'string' }
            },
            required: ['id']
          }
        },
        {
          name: 'entity_delete_record',
          description: 'Delete a restock task',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              confirm: { type: 'boolean' }
            },
            required: ['id', 'confirm']
          }
        },
        {
          name: 'entity_select_record',
          description: 'Select a restock task',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' }
            },
            required: ['id']
          }
        },
        {
          name: 'editor_add_composer-slot',
          description: 'Place a selected record in the spatial composer',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'editor_delete_composer-slot',
          description: 'Remove a record from the spatial composer',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' }
            },
            required: ['id']
          }
        },
        {
          name: 'artifact_export_json',
          description: 'Export session to JSON',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'artifact_import_json',
          description: 'Import session from JSON (stubbed for WebMCP as Playwright handles file selection)',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    });

    window.webmcp_invoke_tool = async (request) => {
      try {
        if (request.tool_name === 'entity_create_record') {
          handleCreate({
            id: crypto.randomUUID(),
            name: request.arguments.name,
            capacity: request.arguments.capacity,
            status: request.arguments.status || 'draft'
          });
          return { success: true };
        }
        if (request.tool_name === 'entity_update_record') {
          const existing = records.find(r => r.id === request.arguments.id);
          if (existing) {
            handleUpdate({ ...existing, ...request.arguments });
          }
          return { success: true };
        }
        if (request.tool_name === 'entity_delete_record') {
          if (request.arguments.confirm) {
            handleDelete(request.arguments.id);
            return { success: true };
          }
          return { success: false, error: 'Confirmation required' };
        }
        if (request.tool_name === 'entity_select_record') {
          handleSelect(request.arguments.id);
          return { success: true };
        }
        if (request.tool_name === 'editor_add_composer-slot') {
          handlePlaceInComposer();
          return { success: true };
        }
        if (request.tool_name === 'editor_delete_composer-slot') {
          handleRemoveFromComposer(request.arguments.id);
          return { success: true };
        }
        if (request.tool_name === 'artifact_export_json') {
          handleExport();
          return { success: true };
        }
        return { success: false, error: 'Unknown tool' };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    };
  }, [records, composerRecords, selectedRecordId, history]); // Important to depend on state for WebMCP to have fresh closures

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col font-sans">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Inbox className="w-6 h-6" />
          Restock Planner
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded disabled:opacity-50"
            aria-label="Undo last action"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-neutral-200 text-neutral-900 rounded hover:bg-neutral-300 cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* Sidebar: Restock Tasks */}
        <aside className="w-full lg:w-80 bg-white border-r flex flex-col h-full shrink-0">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Tasks</h2>
            <button
              onClick={() => openEdit()}
              className="p-1 hover:bg-neutral-100 rounded"
              aria-label="Add Task"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="p-2 border-b flex gap-2">
            {(['all', 'draft', 'ready', 'changed', 'archived'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 text-xs rounded capitalize ${filter === f ? 'bg-neutral-900 text-white' : 'bg-neutral-100 hover:bg-neutral-200'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {getFilteredRecords().length === 0 ? (
              <div className="text-center text-neutral-500 py-8 text-sm">
                No tasks match the filter.
              </div>
            ) : (
              getFilteredRecords().map(record => (
                <div
                  key={record.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedRecordId === record.id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'} ${composerRecords.some(r => r.id === record.id) ? 'opacity-50' : ''}`}
                  onClick={() => handleSelect(record.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(record.id);
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">{record.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-neutral-200 rounded capitalize">{record.status}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-neutral-500">Cap: {record.capacity}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(record); }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Spatial Composer */}
        <section className="flex-1 flex flex-col bg-neutral-50 p-6 overflow-y-auto">
          <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Capacity Summary</h2>
              <div className="flex gap-8">
                <div>
                  <div className="text-sm text-neutral-500">Total</div>
                  <div className="text-2xl font-bold">{derived.totalCapacity}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-500">Used</div>
                  <div className="text-2xl font-bold">{derived.usedCapacity}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-500">Remaining</div>
                  <div className={`text-2xl font-bold ${derived.remainingCapacity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {derived.remainingCapacity}
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4 h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${derived.remainingCapacity < 0 ? 'bg-red-500' : 'bg-neutral-900'}`}
                  style={{ width: `${Math.min(100, (derived.usedCapacity / derived.totalCapacity) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border flex-1 min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Spatial Composer</h2>
                <button
                  onClick={handlePlaceInComposer}
                  disabled={!selectedRecordId || composerRecords.some(r => r.id === selectedRecordId)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Place Selected
                </button>
              </div>

              <div className="flex-1 border-2 border-dashed border-neutral-300 rounded-lg p-4 flex flex-wrap gap-4 content-start">
                {composerRecords.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    Select a task and click 'Place Selected'
                  </div>
                ) : (
                  composerRecords.map(record => (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      key={record.id}
                      className="bg-neutral-100 border border-neutral-300 p-4 rounded-lg flex items-center gap-4"
                      style={{ width: `${Math.max(150, record.capacity * 3)}px` }}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm truncate">{record.name}</div>
                        <div className="text-xs text-neutral-500">Cap: {record.capacity}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveFromComposer(record.id)}
                        className="p-1 hover:bg-neutral-200 rounded"
                        aria-label={`Remove ${record.name}`}
                      >
                        <X className="w-4 h-4 text-neutral-500" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{editForm.id ? 'Edit Task' : 'New Task'}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Capacity (1-100)</label>
                <input
                  type="number"
                  value={editForm.capacity || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                  className="w-full border rounded p-2"
                  min="1" max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editForm.status || 'draft'}
                  onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as Status }))}
                  className="w-full border rounded p-2"
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="changed">Changed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {editError && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                  {editError}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {editForm.id && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure?')) {
                      handleDelete(editForm.id!);
                      setIsEditing(false);
                    }
                  }}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded mr-auto"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={submitEdit}
                className="px-4 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
