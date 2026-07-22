import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Download, Upload, Plus, Trash2, Undo, Settings2, Archive, Filter } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { ItemStatus, PantryItem, SessionData, Snapshot } from './types';


const DEFAULT_ITEMS: PantryItem[] = [
  { id: '1', name: 'Flour', quantity: 5, unit: 'kg', status: 'ready' },
  { id: '2', name: 'Sugar', quantity: 2, unit: 'kg', status: 'draft' },
  { id: '3', name: 'Rice', quantity: 10, unit: 'kg', status: 'ready' }
];

const INITIAL_STATE: SessionData = {
  schemaVersion: 'v1',
  exportedAt: new Date().toISOString(),
  records: DEFAULT_ITEMS,
  derived: {
    totalItems: 3,
    totalStockQty: 17,
    projectedTotalStockQty: 17
  },
  history: []
};

function App() {
  const [session, setSession] = useState<SessionData>(INITIAL_STATE);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ItemStatus | 'all'>('all');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to calculate derived state
  const calculateDerived = (records: PantryItem[]) => {
      const totalItems = records.length;
      const totalStockQty = records.reduce((acc, item) => acc + item.quantity, 0);
      const projectedTotalStockQty = records.reduce((acc, item) => acc + (item.forecastQuantity ?? item.quantity), 0);
      return { totalItems, totalStockQty, projectedTotalStockQty };
  };

  // Expose WebMCP contract
  useEffect(() => {
    window.webmcp_session_info = async () => ({
      task_id: "eval-intelligence/frontend-data-tracking-pantry-nutrition-stock-ledger-forecast-ribbon-rn-github-issue-fields",
      session_id: "s1"
    });

    window.webmcp_list_tools = () => [
      {
        name: "entity_create_record",
        description: "Creates a new record.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            quantity: { type: "number" },
            unit: { type: "string" },
            status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] }
          },
          required: ["name", "quantity", "unit"]
        }
      },
      {
         name: "entity_update_record",
         description: "Updates an existing record.",
         inputSchema: {
           type: "object",
           properties: {
             id: { type: "string" },
             updates: { type: "object" }
           },
           required: ["id", "updates"]
         }
      },
      {
         name: "entity_delete_record",
         description: "Deletes a record.",
         inputSchema: {
           type: "object",
           properties: {
             id: { type: "string" }
           },
           required: ["id"]
         }
      },
      {
         name: "entity_query_records",
         description: "Queries all records and session state.",
         inputSchema: { type: "object", properties: {} }
      },
      {
         name: "forecast_adjust_record",
         description: "Adjusts the forecast for a selected record.",
         inputSchema: {
           type: "object",
           properties: {
             id: { type: "string" },
             delta: { type: "number" }
           },
           required: ["id", "delta"]
         }
      },
      {
         name: "forecast_apply",
         description: "Applies the current forecast adjustment.",
         inputSchema: {
           type: "object",
           properties: {
             id: { type: "string" }
           },
           required: ["id"]
         }
      },
      {
         name: "action_undo",
         description: "Undoes the last action.",
         inputSchema: { type: "object", properties: {} }
      },
      {
         name: "artifact_export_session_json",
         description: "Exports session state.",
         inputSchema: { type: "object", properties: {} }
      },
      {
         name: "artifact_import_session_json",
         description: "Imports session state.",
         inputSchema: {
           type: "object",
           properties: {
             data: { type: "object" }
           },
           required: ["data"]
         }
      }
    ];

    window.webmcp_invoke_tool = async (toolName: string, args: any) => {
        // We capture current state via functional update where needed, or we just read current state.
        // For tools that return state synchronously, we need a way to reliably get the latest state or compute it.

        let resultingState: any = null;

        setSession(currentSession => {
            // Helper to push history
            const createHistorySnapshot = (): Snapshot => ({
                records: JSON.parse(JSON.stringify(currentSession.records)),
                selectedItemId
            });

            if (toolName === 'entity_create_record') {
                const newItem: PantryItem = {
                  id: uuidv4(),
                  name: args.name,
                  quantity: args.quantity,
                  unit: args.unit,
                  status: args.status || 'draft'
                };
                const newRecords = [...currentSession.records, newItem];
                const newState = {
                    ...currentSession,
                    records: newRecords,
                    derived: calculateDerived(newRecords),
                    history: [...currentSession.history, createHistorySnapshot()]
                };
                resultingState = newState;
                return newState;
            } else if (toolName === 'entity_update_record') {
                const newRecords = currentSession.records.map(r => r.id === args.id ? { ...r, ...args.updates } : r);
                const newState = {
                    ...currentSession,
                    records: newRecords,
                    derived: calculateDerived(newRecords),
                    history: [...currentSession.history, createHistorySnapshot()]
                };
                resultingState = newState;
                return newState;
            } else if (toolName === 'entity_delete_record') {
                const newRecords = currentSession.records.filter(r => r.id !== args.id);
                const newState = {
                    ...currentSession,
                    records: newRecords,
                    derived: calculateDerived(newRecords),
                    history: [...currentSession.history, createHistorySnapshot()]
                };
                resultingState = newState;
                return newState;
            } else if (toolName === 'entity_query_records') {
                resultingState = { session: currentSession, selectedItemId };
                return currentSession;
            } else if (toolName === 'forecast_adjust_record') {
                const item = currentSession.records.find(r => r.id === args.id);
                if (!item) {
                    resultingState = { error: "Item not found" };
                    return currentSession;
                }
                const currentQty = item.forecastQuantity ?? item.quantity;
                const newQuantity = currentQty + args.delta;

                // Validate bounds
                if (newQuantity < 0) {
                     resultingState = { error: "Quantity cannot be less than 0" };
                     return currentSession;
                }

                const updatedRecords = currentSession.records.map(r =>
                    r.id === args.id ? { ...r, forecastQuantity: newQuantity, status: 'changed' as ItemStatus } : r
                );

                const newState = {
                    ...currentSession,
                    records: updatedRecords,
                    derived: calculateDerived(updatedRecords),
                    history: [...currentSession.history, createHistorySnapshot()]
                };

                // Using timeout to safely update selectedItemId outside of setSession
                setTimeout(() => setSelectedItemId(args.id), 0);

                resultingState = newState;
                return newState;
            } else if (toolName === 'forecast_apply') {
                const item = currentSession.records.find(r => r.id === args.id);
                if (!item || item.forecastQuantity === undefined) {
                    resultingState = { error: "No forecast to apply" };
                    return currentSession;
                }
                const updatedRecords = currentSession.records.map(r =>
                    r.id === args.id ? { ...r, quantity: item.forecastQuantity!, forecastQuantity: undefined, status: 'ready' as ItemStatus } : r
                );
                const newState = {
                    ...currentSession,
                    records: updatedRecords,
                    derived: calculateDerived(updatedRecords),
                    history: [...currentSession.history, createHistorySnapshot()]
                };

                setTimeout(() => setSelectedItemId(null), 0);

                resultingState = newState;
                return newState;
            } else if (toolName === 'action_undo') {
                if (currentSession.history.length > 0) {
                    const prevSnapshot = currentSession.history[currentSession.history.length - 1];
                    const newHistory = currentSession.history.slice(0, -1);

                    const newState = {
                        ...currentSession,
                        records: prevSnapshot.records,
                        derived: calculateDerived(prevSnapshot.records),
                        history: newHistory
                    };

                    setTimeout(() => setSelectedItemId(prevSnapshot.selectedItemId), 0);

                    resultingState = newState;
                    return newState;
                }
                resultingState = { error: "No history to undo" };
                return currentSession;
            } else if (toolName === 'artifact_export_session_json') {
                resultingState = {
                    ...currentSession,
                    exportedAt: new Date().toISOString()
                };
                return currentSession;
            } else if (toolName === 'artifact_import_session_json') {
                 if (args.data.schemaVersion === 'v1' && Array.isArray(args.data.records)) {
                    const imported = {
                        ...args.data,
                        exportedAt: new Date().toISOString(),
                        history: [...currentSession.history, createHistorySnapshot()]
                    };
                    setTimeout(() => setSelectedItemId(null), 0);
                    resultingState = imported;
                    return imported;
                 }
                 resultingState = { error: "Invalid schema or validation failed" };
                 return currentSession;
            }

            resultingState = { error: "Unknown tool" };
            return currentSession;
        });

        // Resolve after React has processed the state update queue
        return new Promise(resolve => setTimeout(() => resolve(resultingState), 0));
    };
  }, [selectedItemId]);

  const handleUndo = useCallback(() => {
    setSession(prev => {
        if (prev.history.length > 0) {
            const prevSnapshot = prev.history[prev.history.length - 1];
            setSelectedItemId(prevSnapshot.selectedItemId);
            return {
                ...prev,
                records: prevSnapshot.records,
                derived: calculateDerived(prevSnapshot.records),
                history: prev.history.slice(0, -1)
            };
        }
        return prev;
    });
    setErrors({});
  }, []);

  // Keyboard shortcut for Undo
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              handleUndo();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  const saveHistorySnapshot = () => {
    setSession(prev => ({
        ...prev,
        history: [...prev.history, {
            records: JSON.parse(JSON.stringify(prev.records)),
            selectedItemId
        }]
    }));
  };

  const handleCreate = () => {
    saveHistorySnapshot();
    const newItem: PantryItem = {
      id: uuidv4(),
      name: 'New Item',
      quantity: 1,
      unit: 'pc',
      status: 'draft'
    };
    updateSessionRecords([...session.records, newItem]);
  };

  const handleUpdate = (id: string, updates: Partial<PantryItem>) => {
    // Basic validation
    if (updates.quantity !== undefined) {
        if (updates.quantity < 0) {
            setErrors(prev => ({...prev, [id]: "Quantity cannot be less than 0"}));
            return; // Reject invalid update
        } else {
            setErrors(prev => { const next = {...prev}; delete next[id]; return next; });
        }
    }

    saveHistorySnapshot();
    updateSessionRecords(session.records.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleArchive = (id: string) => {
    saveHistorySnapshot();
    updateSessionRecords(session.records.map(r => r.id === id ? { ...r, status: 'archived' } : r));
  };

  const handleDelete = (id: string) => {
    saveHistorySnapshot();
    updateSessionRecords(session.records.filter(r => r.id !== id));
  };

  const updateSessionRecords = (records: PantryItem[]) => {
     setSession(prev => ({
        ...prev,
        records,
        derived: calculateDerived(records)
     }));
  };

  const handleForecastAdjust = (id: string, delta: number) => {
     const item = session.records.find(r => r.id === id);
     if (!item) return;

     const newQuantity = (item.forecastQuantity ?? item.quantity) + delta;

     if (newQuantity < 0) {
         setErrors(prev => ({...prev, [`forecast-${id}`]: "Forecast cannot be less than 0"}));
         return;
     } else {
         setErrors(prev => { const next = {...prev}; delete next[`forecast-${id}`]; return next; });
     }

     saveHistorySnapshot();

     const updatedRecords = session.records.map(r =>
        r.id === id ? { ...r, forecastQuantity: newQuantity, status: 'changed' as ItemStatus } : r
     );

     setSession(prev => ({
         ...prev,
         records: updatedRecords,
         derived: calculateDerived(updatedRecords)
     }));
  };

  const applyForecast = (id: string) => {
     saveHistorySnapshot();
     const item = session.records.find(r => r.id === id);
     if (!item || item.forecastQuantity === undefined) return;

     const updatedRecords = session.records.map(r =>
        r.id === id ? { ...r, quantity: item.forecastQuantity!, forecastQuantity: undefined, status: 'ready' as ItemStatus } : r
     );

     setSession(prev => ({
         ...prev,
         records: updatedRecords,
         derived: calculateDerived(updatedRecords)
     }));
     setSelectedItemId(null);
  };


  const handleExport = () => {
    const dataToExport = {
      ...session,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nutrition-stock-v1-forecast-ribbon.json';
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
        const imported = JSON.parse(event.target?.result as string);
        if (imported.schemaVersion === 'v1' && Array.isArray(imported.records)) {
            saveHistorySnapshot();
            setSession({
                ...imported,
                exportedAt: new Date().toISOString() // regenerate exportedAt
            });
            setSelectedItemId(null);
            setErrors({});
        } else {
            alert('Invalid file format');
        }
      } catch (err) {
        alert('Failed to parse JSON');
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredRecords = useMemo(() => {
    if (filterStatus === 'all') return session.records;
    return session.records.filter(r => r.status === filterStatus);
  }, [session.records, filterStatus]);


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden flex flex-col">

        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <div>
            <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Pantry Stock Ledger</h1>
            <p className="text-sm text-slate-500 mt-1">Manage ingredients and forecast outcomes</p>
          </div>
          <div className="flex gap-2">
             <button onClick={handleUndo} disabled={session.history.length === 0} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 transition-colors" title="Undo">
                <Undo className="w-5 h-5" />
             </button>
             <button onClick={handleExport} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium" title="Export">
                <Download className="w-4 h-4" /> Export
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium" title="Import">
                <Upload className="w-4 h-4" /> Import
             </button>
             <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
          </div>
        </header>

        <div className="flex flex-1 flex-col md:flex-row overflow-hidden min-h-[600px]">
            {/* Main Collection Area */}
            <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
               <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3">
                     <h2 className="text-lg font-medium text-slate-800">Ingredients Collection</h2>
                     <div className="relative flex items-center">
                         <Filter className="w-4 h-4 text-slate-400 absolute left-2" />
                         <select
                             value={filterStatus}
                             onChange={e => setFilterStatus(e.target.value as any)}
                             className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md bg-white focus:ring-2 focus:ring-blue-100 outline-none text-slate-600"
                         >
                             <option value="all">All Statuses</option>
                             <option value="draft">Draft</option>
                             <option value="ready">Ready</option>
                             <option value="changed">Changed</option>
                             <option value="archived">Archived</option>
                         </select>
                     </div>
                 </div>
                 <button onClick={handleCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" /> Add Item
                 </button>
               </div>

               <div className="space-y-3">
                  {filteredRecords.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">No items match your filter.</div>
                  ) : (
                      filteredRecords.map(item => (
                         <div key={item.id}>
                             <div
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-all duration-200 ${selectedItemId === item.id ? 'border-blue-400 bg-blue-50/30 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                onClick={() => selectedItemId !== item.id && setSelectedItemId(item.id)}
                             >
                                <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:items-center">
                                    <div className="flex-1 flex gap-2 items-center">
                                        <input
                                           type="text"
                                           value={item.name}
                                           onChange={(e) => handleUpdate(item.id, { name: e.target.value, status: 'changed' })}
                                           className="font-medium text-slate-800 bg-transparent border-none focus:ring-2 focus:ring-blue-100 rounded px-1 outline-none w-full max-w-[200px]"
                                           onClick={e => e.stopPropagation()}
                                           disabled={item.status === 'archived'}
                                        />
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            item.status === 'ready' ? 'bg-green-100 text-green-700' :
                                            item.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                                            item.status === 'changed' ? 'bg-amber-100 text-amber-700' :
                                            item.status === 'archived' ? 'bg-slate-200 text-slate-500' :
                                            'bg-slate-100 text-slate-500'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 w-32">
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleUpdate(item.id, { quantity: Number(e.target.value), status: 'changed' })}
                                            className={`w-16 text-right border ${errors[item.id] ? 'border-red-400' : 'border-slate-200'} rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50`}
                                            onClick={e => e.stopPropagation()}
                                            disabled={item.status === 'archived'}
                                        />
                                        <input
                                            type="text"
                                            value={item.unit}
                                            onChange={(e) => handleUpdate(item.id, { unit: e.target.value, status: 'changed' })}
                                            className="w-12 border-none bg-transparent text-sm text-slate-500 focus:ring-2 focus:ring-blue-100 rounded px-1 outline-none"
                                            onClick={e => e.stopPropagation()}
                                            disabled={item.status === 'archived'}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-4 sm:mt-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                                    <button
                                       onClick={(e) => { e.stopPropagation(); setSelectedItemId(item.id === selectedItemId ? null : item.id); }}
                                       className={`flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded transition-colors ${selectedItemId === item.id ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
                                       disabled={item.status === 'archived'}
                                    >
                                       <Settings2 className="w-4 h-4" /> {selectedItemId === item.id ? 'Forecasting' : 'Forecast'}
                                    </button>
                                    {item.status !== 'archived' && (
                                       <button onClick={(e) => { e.stopPropagation(); handleArchive(item.id); }} className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-100 transition-colors" title="Archive">
                                           <Archive className="w-4 h-4" />
                                       </button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors" title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                             </div>
                             {errors[item.id] && (
                                 <p className="text-xs text-red-500 mt-1 ml-1">{errors[item.id]}</p>
                             )}
                         </div>
                      ))
                  )}
               </div>
            </main>

            {/* Sidebar / Forecast Ribbon & Summary */}
            <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 bg-white flex flex-col shadow-[rgba(0,0,0,0.02)_-4px_0px_10px]">
                {/* Forecast Ribbon */}
                <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Forecast Ribbon</h3>
                    {selectedItemId ? (() => {
                        const activeItem = session.records.find(r => r.id === selectedItemId);
                        if(!activeItem) return null;
                        const displayQty = activeItem.forecastQuantity ?? activeItem.quantity;
                        const isAdjusted = activeItem.forecastQuantity !== undefined && activeItem.forecastQuantity !== activeItem.quantity;

                        return (
                           <div className="space-y-4">
                               <div>
                                  <p className="text-sm font-medium text-slate-800 truncate" title={activeItem.name}>{activeItem.name}</p>
                                  <p className="text-xs text-slate-500">Current: {activeItem.quantity} {activeItem.unit}</p>
                               </div>
                               <div className={`flex items-center justify-between bg-white border ${errors[`forecast-${activeItem.id}`] ? 'border-red-400' : 'border-slate-200'} rounded-lg p-2 shadow-sm`}>
                                   <button onClick={() => handleForecastAdjust(activeItem.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 border border-transparent hover:border-slate-200">-</button>
                                   <div className="text-center">
                                       <span className={`text-xl font-bold ${isAdjusted ? 'text-blue-600' : 'text-slate-800'}`}>{displayQty}</span>
                                       <span className="text-sm text-slate-500 ml-1">{activeItem.unit}</span>
                                   </div>
                                   <button onClick={() => handleForecastAdjust(activeItem.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 border border-transparent hover:border-slate-200">+</button>
                               </div>
                               {errors[`forecast-${activeItem.id}`] && (
                                   <p className="text-xs text-red-500">{errors[`forecast-${activeItem.id}`]}</p>
                               )}
                               {isAdjusted && (
                                   <div className="flex gap-2 mt-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-200 motion-reduce:transition-none">
                                       <button onClick={() => applyForecast(activeItem.id)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-md text-sm font-medium transition-colors">Apply</button>
                                   </div>
                               )}
                           </div>
                        );
                    })() : (
                        <div className="text-sm text-slate-500 text-center py-6 border border-dashed border-slate-200 rounded-lg">
                            Select an item to adjust forecast outcomes.
                        </div>
                    )}
                </div>

                {/* Derived Summary */}
                <div className="p-6 flex-1">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Derived Summary</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-sm text-slate-600">Total Unique Items</span>
                            <span className="font-medium text-slate-800">{session.derived.totalItems}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-sm text-slate-600">Total Stock (Qty)</span>
                            <span className="font-medium text-slate-800">
                                {session.derived.totalStockQty}
                            </span>
                        </div>
                        {session.derived.totalStockQty !== session.derived.projectedTotalStockQty && (
                            <div className="flex justify-between items-center py-2 border-b border-slate-100 bg-blue-50/50 -mx-2 px-2 rounded motion-safe:animate-in motion-safe:fade-in motion-reduce:transition-none">
                                <span className="text-sm text-blue-700 font-medium">Projected Stock</span>
                                <span className="font-bold text-blue-700">
                                    {session.derived.projectedTotalStockQty}
                                </span>
                            </div>
                        )}
                        <div className="mt-6 text-xs text-slate-400">
                            Last exported: {new Date(session.exportedAt).toLocaleString()}
                        </div>
                    </div>
                </div>
            </aside>
        </div>
      </div>
    </div>
  );
}

export default App;
