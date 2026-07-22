import React, { useState, useEffect } from 'react';
import { Download, Upload, Plus, Undo2, LayoutTemplate, Trash2, X, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  ComicPanelRhythmBoardSession,
  ComicPanel,
  PanelStatus,
  DerivedState,
  SessionHistory
} from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MAX_CAPACITY_AREA = 10000;

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function calculateDerived(records: ComicPanel[]): DerivedState {
  let used = 0;
  const byStatus: Record<PanelStatus, number> = {
    empty: 0,
    draft: 0,
    ready: 0,
    changed: 0,
    archived: 0
  };
  for (const r of records) {
    if (r.status !== 'archived') {
      used += r.width * r.height;
    }
    byStatus[r.status]++;
  }
  return {
    summary: {
      total: records.length,
      byStatus,
      capacityUsed: Math.min(100, (used / MAX_CAPACITY_AREA) * 100)
    }
  };
}

export default function App() {
  const [records, setRecords] = useState<ComicPanel[]>([]);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [undoStack, setUndoStack] = useState<ComicPanel[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<PanelStatus | 'all'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const derived = calculateDerived(records);

  const commitState = (newRecords: ComicPanel[], action: string) => {
    setUndoStack(prev => [...prev, records]);
    setRecords(newRecords);
    setHistory(prev => [...prev, { timestamp: new Date().toISOString(), action }]);
    setErrorMsg(null);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, -1));
    setRecords(prev);
    setHistory(prevHist => [...prevHist, { timestamp: new Date().toISOString(), action: 'undo' }]);
    setErrorMsg(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, records]);

  // WebMCP Integration
  useEffect(() => {
    window.webmcp_session_info = {
      name: 'comic-rhythm-spatial-composer',
      version: '1.0.0'
    };

    window.webmcp_list_tools = () => [
      {
        name: 'get_state',
        description: 'Get current session state',
        inputSchema: {}
      },
      {
        name: 'import_state',
        description: 'Import session state',
        inputSchema: {
          type: 'object',
          properties: {
            session: { type: 'object' }
          },
          required: ['session']
        }
      },
      {
        name: 'mutate_panel',
        description: 'Place a selected record in a spatial composer and rebalance capacity.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' }
          },
          required: ['id', 'x', 'y', 'width', 'height']
        }
      }
    ];

    window.webmcp_invoke_tool = (name: string, args: any) => {
      if (name === 'get_state') {
        return {
          schemaVersion: 'v1',
          exportedAt: new Date().toISOString(),
          records,
          derived,
          history
        };
      }
      if (name === 'import_state') {
        const session = args.session;
        if (session.schemaVersion !== 'v1' || !Array.isArray(session.records)) {
          throw new Error('Invalid schema');
        }
        setRecords(session.records);
        setHistory(session.history || []);
        setUndoStack([]);
        return { success: true };
      }
      if (name === 'mutate_panel') {
        // Find panel, apply mutation if valid
        const panel = records.find(r => r.id === args.id);
        if (!panel) throw new Error('Panel not found');

        // validate capacity
        let used = 0;
        for (const r of records) {
          if (r.id !== args.id && r.status !== 'archived') {
            used += r.width * r.height;
          }
        }
        const newArea = args.width * args.height;
        if (used + newArea > MAX_CAPACITY_AREA) {
          throw new Error('Capacity exceeded');
        }

        const newRecords = records.map(r => r.id === args.id ? { ...r, x: args.x, y: args.y, width: args.width, height: args.height, status: 'changed' as PanelStatus } : r);
        commitState(newRecords, 'mutate_panel');
        return { success: true };
      }
      throw new Error(`Tool ${name} not found`);
    };
  }, [records, history, undoStack, derived]);

  const addPanel = () => {
    const newPanel: ComicPanel = {
      id: generateId(),
      title: 'New Panel',
      status: 'draft',
      x: 0,
      y: 0,
      width: 100,
      height: 100
    };
    if (derived.summary.capacityUsed >= 100) {
      setErrorMsg('Capacity exceeded. Cannot add new panel.');
      return;
    }
    commitState([...records, newPanel], 'add_panel');
    setSelectedId(newPanel.id);
  };

  const updatePanel = (id: string, updates: Partial<ComicPanel>) => {
    const panel = records.find(r => r.id === id);
    if (!panel) return;

    if (updates.width !== undefined || updates.height !== undefined || updates.status !== undefined) {
      const newWidth = updates.width ?? panel.width;
      const newHeight = updates.height ?? panel.height;
      const newStatus = updates.status ?? panel.status;

      let used = 0;
      for (const r of records) {
        if (r.id !== id && r.status !== 'archived') {
          used += r.width * r.height;
        }
      }
      if (newStatus !== 'archived' && used + (newWidth * newHeight) > MAX_CAPACITY_AREA) {
        setErrorMsg('Capacity exceeded. Change rejected.');
        return;
      }
    }

    commitState(
      records.map(r => r.id === id ? { ...r, ...updates, status: updates.status || (r.status === 'empty' ? 'draft' : 'changed') } : r),
      'update_panel'
    );
  };

  const deletePanel = (id: string) => {
    commitState(records.filter(r => r.id !== id), 'delete_panel');
    if (selectedId === id) setSelectedId(null);
  };

  const exportData = () => {
    const data: ComicPanelRhythmBoardSession = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comic-rhythm-v1-spatial-composer.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.schemaVersion !== 'v1' || !Array.isArray(json.records)) {
          setErrorMsg('Invalid schema: Missing schemaVersion v1 or records array.');
          return;
        }
        // Basic validation
        const uniqueIds = new Set(json.records.map((r: any) => r.id));
        if (uniqueIds.size !== json.records.length) {
          setErrorMsg('Invalid schema: Duplicate IDs.');
          return;
        }

        setRecords(json.records);
        setHistory(json.history || []);
        setUndoStack([]);
        setSelectedId(null);
        setErrorMsg(null);
      } catch (err) {
        setErrorMsg('Malformed JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSpatialMutate = (id: string, dx: number, dy: number, dw: number, dh: number) => {
    const panel = records.find(r => r.id === id);
    if (!panel) return;
    const newX = Math.max(0, panel.x + dx);
    const newY = Math.max(0, panel.y + dy);
    const newW = Math.max(10, panel.width + dw);
    const newH = Math.max(10, panel.height + dh);

    updatePanel(id, { x: newX, y: newY, width: newW, height: newH, status: 'changed' });
  };

  const visibleRecords = records.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col md:flex-row overflow-hidden font-sans">

      {/* Sidebar: Controls & Summary */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-[40vh] md:h-screen overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-indigo-600" />
            Rhythm Board
          </h1>
          <p className="text-sm text-gray-500 mt-1">Spatial Composer</p>
        </div>

        <div className="p-4 flex gap-2">
          <button onClick={addPanel} className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Panel
          </button>
          <button onClick={undo} disabled={undoStack.length === 0} className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors" title="Undo (Ctrl+Z)">
            <Undo2 className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-4 mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start gap-2 text-sm border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-4 border-t border-gray-200">
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider text-gray-500">Filters</h2>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as PanelStatus | 'all')}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="p-4 border-t border-gray-200 flex-1">
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider text-gray-500">Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Panels:</span>
              <span className="font-medium">{derived.summary.total}</span>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Capacity Used:</span>
                <span className="font-medium">{derived.summary.capacityUsed.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn("h-2 rounded-full transition-all duration-300", derived.summary.capacityUsed > 90 ? "bg-red-500" : "bg-indigo-500")}
                  style={{ width: `${derived.summary.capacityUsed}%` }}
                />
              </div>
            </div>
            <div className="pt-2">
               <span className="text-sm text-gray-600 block mb-2">By Status:</span>
               <div className="grid grid-cols-2 gap-2 text-sm">
                 {Object.entries(derived.summary.byStatus).map(([status, count]) => (
                   <div key={status} className="flex justify-between bg-gray-50 px-2 py-1 rounded">
                     <span className="capitalize text-gray-600">{status}</span>
                     <span className="font-medium">{count}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider text-gray-500">Artifact</h2>
          <div className="flex gap-2">
            <button onClick={exportData} className="flex-1 border border-gray-300 py-2 px-3 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 text-sm">
              <Download className="w-4 h-4" /> Export
            </button>
            <label className="flex-1 border border-gray-300 py-2 px-3 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 text-sm cursor-pointer">
              <Upload className="w-4 h-4" /> Import
              <input type="file" accept=".json" className="hidden" onChange={importData} />
            </label>
          </div>
          <button
            onClick={() => {
              commitState([], 'clear_all');
              setSelectedId(null);
            }}
            className="mt-2 w-full border border-red-300 text-red-600 py-2 px-3 rounded-md flex items-center justify-center gap-2 hover:bg-red-50 text-sm"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Main Surface: Spatial Composer */}
      <div className="flex-1 bg-gray-100 flex flex-col relative h-[60vh] md:h-screen">
        <div className="absolute inset-0 overflow-auto p-4 md:p-8 border-4 border-transparent focus-within:border-indigo-300 outline-none" tabIndex={0}>
          <div className="relative" style={{ width: 2000, height: 2000 }}>
             {/* Grid background */}
             <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

             {visibleRecords.map(panel => (
               <div
                 key={panel.id}
                 onClick={() => setSelectedId(panel.id)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     setSelectedId(panel.id);
                   }
                   if (selectedId === panel.id) {
                     const step = e.shiftKey ? 20 : 5;
                     if (e.key === 'ArrowRight') handleSpatialMutate(panel.id, step, 0, 0, 0);
                     if (e.key === 'ArrowLeft') handleSpatialMutate(panel.id, -step, 0, 0, 0);
                     if (e.key === 'ArrowDown') handleSpatialMutate(panel.id, 0, step, 0, 0);
                     if (e.key === 'ArrowUp') handleSpatialMutate(panel.id, 0, -step, 0, 0);
                   }
                 }}
                 tabIndex={0}
                 className={cn(
                   "absolute border-2 bg-white rounded-md shadow-sm transition-all duration-200 outline-none cursor-pointer overflow-hidden flex flex-col group",
                   selectedId === panel.id ? "border-indigo-500 ring-4 ring-indigo-200 z-10" : "border-gray-300 hover:border-gray-400 z-0",
                   panel.status === 'archived' && "opacity-50 grayscale",
                   panel.status === 'ready' && "border-green-500",
                   panel.status === 'changed' && "border-yellow-500"
                 )}
                 style={{
                   left: panel.x,
                   top: panel.y,
                   width: panel.width,
                   height: panel.height,
                 }}
               >
                 <div className="bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500 border-b flex justify-between items-center">
                   <span className="truncate pr-2">{panel.title}</span>
                   <span className={cn(
                     "px-1.5 py-0.5 rounded-sm text-[10px] uppercase tracking-wider",
                     panel.status === 'ready' ? "bg-green-100 text-green-700" :
                     panel.status === 'changed' ? "bg-yellow-100 text-yellow-700" :
                     panel.status === 'draft' ? "bg-blue-100 text-blue-700" :
                     "bg-gray-200 text-gray-700"
                   )}>{panel.status}</span>
                 </div>
                 <div className="flex-1 p-2 flex items-center justify-center text-gray-300 group-hover:text-gray-400 transition-colors">
                    {panel.width} x {panel.height}
                 </div>

                 {/* Resize handles when selected */}
                 {selectedId === panel.id && (
                   <>
                     <div
                       className="absolute bottom-0 right-0 w-4 h-4 bg-indigo-500 cursor-se-resize rounded-tl-sm rounded-br-sm"
                       onMouseDown={(e) => {
                         e.preventDefault();
                         e.stopPropagation();
                         const startX = e.clientX;
                         const startY = e.clientY;
                         const onMouseMove = (me: MouseEvent) => {
                           handleSpatialMutate(panel.id, 0, 0, me.clientX - startX, me.clientY - startY);
                         };
                         const onMouseUp = () => {
                           document.removeEventListener('mousemove', onMouseMove);
                           document.removeEventListener('mouseup', onMouseUp);
                         };
                         document.addEventListener('mousemove', onMouseMove);
                         document.addEventListener('mouseup', onMouseUp);
                       }}
                     />
                   </>
                 )}
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Inspector / Detail Panel */}
      {selectedId && (
        <div className="w-full md:w-72 bg-white border-l border-gray-200 flex flex-col h-[50vh] md:h-screen overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold">Edit Panel</h2>
            <button onClick={() => setSelectedId(null)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {records.find(r => r.id === selectedId) && (() => {
            const panel = records.find(r => r.id === selectedId)!;
            return (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={panel.title}
                    onChange={e => updatePanel(panel.id, { title: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={panel.status}
                    onChange={e => updatePanel(panel.id, { status: e.target.value as PanelStatus })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="empty">Empty</option>
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="changed">Changed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">X</label>
                    <input
                      type="number"
                      value={panel.x}
                      onChange={e => updatePanel(panel.id, { x: parseInt(e.target.value) || 0, status: 'changed' })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Y</label>
                    <input
                      type="number"
                      value={panel.y}
                      onChange={e => updatePanel(panel.id, { y: parseInt(e.target.value) || 0, status: 'changed' })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                    <input
                      type="number"
                      value={panel.width}
                      onChange={e => updatePanel(panel.id, { width: parseInt(e.target.value) || 10, status: 'changed' })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                    <input
                      type="number"
                      value={panel.height}
                      onChange={e => updatePanel(panel.id, { height: parseInt(e.target.value) || 10, status: 'changed' })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => deletePanel(panel.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Panel
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
}
