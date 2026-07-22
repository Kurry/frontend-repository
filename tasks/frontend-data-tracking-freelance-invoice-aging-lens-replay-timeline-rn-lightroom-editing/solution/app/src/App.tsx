import React, { useState, useEffect, useCallback } from 'react';
import type { FreelanceInvoiceAgingLensSession, SessionRecord, RecordState, RecordStatus } from './types';
import { computeDerived, generateId } from './utils';
import { Plus, Trash2, Undo, Download, Upload, Clock, Edit2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const initialSession: FreelanceInvoiceAgingLensSession = {
  schemaVersion: 'v1',
  exportedAt: new Date().toISOString(),
  records: [],
  derived: { totalAmount: 0, readyCount: 0, draftCount: 0, archivedCount: 0 }
};

const getStatusColor = (status: RecordStatus) => {
  switch (status) {
    case 'empty': return 'bg-gray-100 text-gray-500';
    case 'draft': return 'bg-yellow-100 text-yellow-800';
    case 'ready': return 'bg-green-100 text-green-800';
    case 'changed': return 'bg-blue-100 text-blue-800';
    case 'archived': return 'bg-gray-800 text-gray-200';
    default: return 'bg-gray-100';
  }
};

declare global {
  interface Window {
    webmcp_session_info: () => { status: string; contract_version: string };
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (name: string, args: any) => any;
  }
}

export default function App() {
  const [session, setSession] = useState<FreelanceInvoiceAgingLensSession>(initialSession);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RecordStatus | 'all'>('all');

  const addRecord = () => {
    const newId = generateId();
    const initialState: RecordState = {
      id: newId,
      status: 'draft',
      title: 'New Invoice',
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      client: ''
    };

    const newRecord: SessionRecord = {
      id: newId,
      history: [initialState],
      currentIndex: 0
    };

    setSession(prev => {
      const nextRecords = [...prev.records, newRecord];
      return {
        ...prev,
        records: nextRecords,
        derived: computeDerived(nextRecords)
      };
    });
    setSelectedRecordId(newId);
  };

  const updateRecord = (id: string, updates: Partial<RecordState>) => {
    setSession(prev => {
      const nextRecords = prev.records.map(record => {
        if (record.id !== id) return record;

        const currentState = record.history[record.currentIndex];
        const nextState = { ...currentState, ...updates };

        // Validation: reject negative amount
        if (nextState.amount < 0) return record;
        if (!nextState.title) return record;

        const newHistory = [...record.history.slice(0, record.currentIndex + 1), nextState];

        return {
          ...record,
          history: newHistory,
          currentIndex: newHistory.length - 1
        };
      });

      return {
        ...prev,
        records: nextRecords,
        derived: computeDerived(nextRecords)
      };
    });
  };

  const deleteRecord = (id: string) => {
    setSession(prev => {
      const nextRecords = prev.records.filter(r => r.id !== id);
      if (selectedRecordId === id) setSelectedRecordId(null);
      return {
        ...prev,
        records: nextRecords,
        derived: computeDerived(nextRecords)
      };
    });
  };

  const scrubTimeline = (recordId: string, index: number) => {
    setSession(prev => {
      const nextRecords = prev.records.map(record => {
        if (record.id !== recordId) return record;
        if (index < 0 || index >= record.history.length) return record;

        return {
          ...record,
          currentIndex: index
        };
      });
      return {
        ...prev,
        records: nextRecords,
        derived: computeDerived(nextRecords)
      };
    });
  };

  const undoLastMutation = useCallback(() => {
    if (!selectedRecordId) return;
    setSession(prev => {
      const nextRecords = prev.records.map(record => {
        if (record.id !== selectedRecordId) return record;
        if (record.currentIndex === 0) return record;
        return {
          ...record,
          currentIndex: record.currentIndex - 1
        };
      });
      return {
        ...prev,
        records: nextRecords,
        derived: computeDerived(nextRecords)
      };
    });
  }, [selectedRecordId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undoLastMutation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLastMutation]);

  const exportArtifact = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      ...session,
      exportedAt: new Date().toISOString()
    }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "invoice-aging-v1-replay-timeline.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importArtifact = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.schemaVersion !== 'v1') throw new Error('Invalid schema version');
        if (!Array.isArray(imported.records)) throw new Error('Invalid records');

        const validIds = new Set();
        for (const record of imported.records) {
            if (validIds.has(record.id)) throw new Error('Duplicate IDs');
            validIds.add(record.id);
            if (!Array.isArray(record.history)) throw new Error('Invalid history');
        }

        setSession({
          ...imported,
          exportedAt: new Date().toISOString(),
          derived: computeDerived(imported.records)
        });
      } catch (err) {
        console.error("Import failed:", err);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    window.webmcp_session_info = () => ({
      status: "idle",
      contract_version: "1.0.0"
    });

    window.webmcp_list_tools = () => [
      {
        name: "seed_state",
        description: "Seed a deterministic collection with empty, boundary, valid, and conflict states.",
        schema: {
          type: "object",
          properties: {
            records: { type: "array" }
          },
          required: ["records"]
        }
      },
      {
        name: "query_state",
        description: "Query the current state.",
        schema: { type: "object", properties: {}, required: [] }
      },
      {
        name: "export_artifact",
        description: "Export the session artifact.",
        schema: { type: "object", properties: {}, required: [] }
      },
      {
        name: "import_artifact",
        description: "Clear and import it with field-level validation.",
        schema: {
          type: "object",
          properties: {
            artifact: { type: "string" }
          },
          required: ["artifact"]
        }
      }
    ];

    window.webmcp_invoke_tool = (name: string, args: any) => {
      if (name === 'seed_state') {
        const newRecords = args.records.map((r: any) => ({
           id: r.id || generateId(),
           history: [r],
           currentIndex: 0
        }));
        setSession({
          schemaVersion: 'v1',
          exportedAt: new Date().toISOString(),
          records: newRecords,
          derived: computeDerived(newRecords)
        });
        return { success: true };
      }
      if (name === 'query_state') {
        return session;
      }
      if (name === 'export_artifact') {
        return { artifact: JSON.stringify(session) };
      }
      if (name === 'import_artifact') {
        try {
          const imported = JSON.parse(args.artifact);
          if (imported.schemaVersion !== 'v1') return { error: 'Invalid schema' };
          setSession({
            ...imported,
            exportedAt: new Date().toISOString(),
            derived: computeDerived(imported.records)
          });
          return { success: true };
        } catch (e) {
          return { error: 'Invalid JSON' };
        }
      }
      return { error: 'Unknown tool' };
    };
  }, [session]);

  const filteredRecords = session.records.filter(record => {
    if (filter === 'all') return true;
    const currentState = record.history[record.currentIndex];
    return currentState.status === filter;
  });

  const selectedRecord = session.records.find(r => r.id === selectedRecordId);
  const selectedState = selectedRecord?.history[selectedRecord.currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-sm">
      {/* Sidebar: Invoices Collection */}
      <aside className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-auto md:h-screen">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="font-semibold text-gray-800">Invoices Lens</h1>
          <button onClick={addRecord} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" aria-label="New Invoice">
            <Plus size={16} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 space-y-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredRecords.map(record => {
            const state = record.history[record.currentIndex];
            const isSelected = selectedRecordId === record.id;
            return (
              <div
                key={record.id}
                onClick={() => setSelectedRecordId(record.id)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all duration-200 group relative",
                  isSelected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                )}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedRecordId(record.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-900 truncate">{state.title || 'Untitled'}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", getStatusColor(state.status))}>
                    {state.status}
                  </span>
                </div>
                <div className="text-gray-500 text-xs flex justify-between">
                  <span>{state.client || 'No client'}</span>
                  <span className="font-medium">${state.amount.toFixed(2)}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                  aria-label="Delete record"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          {filteredRecords.length === 0 && (
             <div className="text-center text-gray-500 py-8 text-sm">No invoices found.</div>
          )}
        </div>
      </aside>

      {/* Main Canvas: Replay Timeline Surface */}
      <main className="flex-1 flex flex-col h-auto md:h-screen bg-white">
        {selectedRecord && selectedState ? (
          <>
            <header className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-800">Editor: {selectedState.title}</h2>
                <div className="flex items-center text-gray-500 text-xs">
                  <Clock size={14} className="mr-1" />
                  History entries: {selectedRecord.history.length}
                </div>
              </div>
              <button
                onClick={undoLastMutation}
                disabled={selectedRecord.currentIndex === 0}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Undo size={14} className="mr-1.5" /> Undo (Cmd+Z)
              </button>
            </header>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-6">

                {/* Form Fields */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 transition-all duration-300 motion-reduce:transition-none">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={selectedState.title}
                        onChange={e => updateRecord(selectedRecord.id, { title: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Status</label>
                      <select
                        value={selectedState.status}
                        onChange={e => updateRecord(selectedRecord.id, { status: e.target.value as RecordStatus })}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="ready">Ready</option>
                        <option value="changed">Changed</option>
                        <option value="archived">Archived</option>
                        <option value="empty">Empty</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Amount ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={selectedState.amount}
                        onChange={e => updateRecord(selectedRecord.id, { amount: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Due Date</label>
                      <input
                        type="date"
                        value={selectedState.dueDate}
                        onChange={e => updateRecord(selectedRecord.id, { dueDate: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Client</label>
                      <input
                        type="text"
                        value={selectedState.client}
                        onChange={e => updateRecord(selectedRecord.id, { client: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Timeline Scrubber */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                    <Clock size={16} className="mr-2 text-gray-500" />
                    Replay Timeline
                  </h3>
                  <div className="relative pt-4">
                    <input
                      type="range"
                      min={0}
                      max={selectedRecord.history.length - 1}
                      value={selectedRecord.currentIndex}
                      onChange={e => scrubTimeline(selectedRecord.id, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Scrub through history"
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium">
                      <span>Origin</span>
                      <span>Current: #{selectedRecord.currentIndex + 1}</span>
                      <span>Latest</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 space-y-4">
            <Edit2 size={48} className="text-gray-300" />
            <p className="text-lg font-medium text-gray-600">Select an invoice to begin editing</p>
            <p className="text-sm text-center max-w-md">Scrub through the timeline of any record to view its history and restore previous states.</p>
          </div>
        )}
      </main>

      {/* Right Sidebar: Derived View & Artifact */}
      <aside className="w-full md:w-64 bg-white border-l border-gray-200 flex flex-col h-auto md:h-screen">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800 flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
            Derived Summary
          </h2>
        </div>

        <div className="p-4 space-y-4 flex-1">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 transition-all duration-300">
            <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Total Value</div>
            <div className="text-2xl font-bold text-blue-900">${session.derived.totalAmount.toFixed(2)}</div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Ready</span>
              <span className="font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{session.derived.readyCount}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Drafts</span>
              <span className="font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">{session.derived.draftCount}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Archived</span>
              <span className="font-medium bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">{session.derived.archivedCount}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
          <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Portable Artifact</h3>
          <button
            onClick={exportArtifact}
            className="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <Download size={14} className="mr-2" /> Export JSON
          </button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={importArtifact}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Import JSON"
            />
            <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-800 text-white rounded shadow-sm text-sm font-medium hover:bg-gray-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none pointer-events-none">
              <Upload size={14} className="mr-2" /> Import Validated
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center">v1 schema only. Invalid inputs rejected.</p>
        </div>
      </aside>
    </div>
  );
}
