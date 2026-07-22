import { useEffect, useState } from 'react';
import { useStore } from './store';
import type { SubscriptionStatus } from './store';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Download, Upload, Trash, Edit2, Plus, X, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

function App() {
  const {
    records,
    history,
    selectedRecordId,
    filterStatus,
    timelineCheckpointIndex,
    scrubbedRecordState,
    addRecord,
    updateRecord,
    deleteRecord,
    quarantineRecord,
    selectRecord,
    setFilterStatus,
    undoLastMutation,
    scrubToTimelineEvent,
    restoreTimelineCheckpoint,
    cancelScrub,
    importSession,
    exportSession,
    clearSession
  } = useStore();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', cost: '', renewalDate: '', status: 'draft' as SubscriptionStatus });

  // WebMCP Registration
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w.webmcp_session_info = {
       task_slug: "frontend-data-tracking-subscription-renewal-radar-replay-timeline-rn-lightroom-editing",
       artifacts: ["subscription-radar-v1-replay-timeline.json"]
    };

    w.webmcp_list_tools = () => [
      { name: "get_state", description: "Get full application state", inputSchema: {} },
      { name: "create_record", description: "Create a new subscription", inputSchema: { name: "string", cost: "number", renewalDate: "string", status: "string" } },
      { name: "update_record", description: "Update a subscription", inputSchema: { id: "string", updates: "object" } },
      { name: "delete_record", description: "Delete a subscription", inputSchema: { id: "string" } },
      { name: "quarantine_record", description: "Quarantine a subscription", inputSchema: { id: "string" } },
      { name: "trace_record", description: "Get history trace of a record", inputSchema: { id: "string" } },
      { name: "undo_mutation", description: "Undo last mutation", inputSchema: {} },
      { name: "export_session", description: "Export the session", inputSchema: {} },
      { name: "import_session", description: "Import a session", inputSchema: { session: "object" } },
      { name: "clear_session", description: "Clear the session", inputSchema: {} }
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    w.webmcp_invoke_tool = (name: string, args: any) => {
        const state = useStore.getState();
        switch(name) {
           case "get_state": return { state: state.exportSession() };
           case "create_record":
              state.addRecord(args);
              return { success: true };
           case "update_record":
              state.updateRecord(args.id, args.updates);
              return { success: true };
           case "delete_record":
              state.deleteRecord(args.id);
              return { success: true };
           case "quarantine_record":
              state.quarantineRecord(args.id);
              return { success: true };
           case "trace_record":
              return { history: state.history.filter(h => h.recordId === args.id) };
           case "undo_mutation":
              state.undoLastMutation();
              return { success: true };
           case "export_session":
              return { session: state.exportSession() };
           case "import_session":
              state.importSession(args.session);
              return { success: true };
           case "clear_session":
              state.clearSession();
              return { success: true };
           default:
              throw new Error(`Unknown tool: ${name}`);
        }
    };
  }, []);

  const handleExport = () => {
    const session = exportSession();
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscription-radar-v1-replay-timeline.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const session = JSON.parse(event.target?.result as string);
        importSession(session);
      } catch (err) {
        console.error("Failed to parse JSON", err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const derived = exportSession().derived;
  const filteredRecords = records.filter(r => filterStatus === 'all' || r.status === filterStatus);
  const selectedRecord = records.find(r => r.id === selectedRecordId);
  const displayRecord = selectedRecordId === 'new' ? null : (scrubbedRecordState || selectedRecord);

  // Get history just for the selected record
  const selectedRecordHistory = history.filter(h => h.recordId === selectedRecordId);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(selectedRecordId && selectedRecordId !== 'new' && isEditing) {
       updateRecord(selectedRecordId, { ...formData, cost: parseFloat(formData.cost) });
    } else {
       addRecord({ ...formData, cost: parseFloat(formData.cost), status: formData.status as SubscriptionStatus });
    }
    setIsEditing(false);
    setFormData({ name: '', cost: '', renewalDate: '', status: 'draft' });
    if(selectedRecordId === 'new') selectRecord(null);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'ready': return 'bg-green-100 text-green-700';
      case 'changed': return 'bg-blue-100 text-blue-700';
      case 'quarantined': return 'bg-red-100 text-red-700 border border-red-300';
      case 'archived': return 'bg-neutral-100 text-neutral-700 line-through opacity-70';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-4 md:p-8 font-sans flex flex-col md:flex-row gap-6">

      {/* Primary Surface: List & Controls */}
      <div className="flex-1 flex flex-col gap-4 max-w-3xl">
        <header className="flex justify-between items-end border-b pb-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Renewal Radar</h1>
            <p className="text-neutral-500">Manage and track your subscriptions.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={undoLastMutation} className="p-2 bg-neutral-200 rounded hover:bg-neutral-300 transition-colors focus:ring focus:ring-black" aria-label="Undo last mutation" title="Undo">
              <RotateCcw size={20} />
            </button>
            <button onClick={handleExport} className="p-2 bg-neutral-200 rounded hover:bg-neutral-300 transition-colors focus:ring focus:ring-black" aria-label="Export session" title="Export">
               <Download size={20} />
            </button>
            <label className="p-2 bg-neutral-200 rounded hover:bg-neutral-300 transition-colors cursor-pointer focus-within:ring focus-within:ring-black" aria-label="Import session" title="Import">
               <Upload size={20} />
               <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button onClick={clearSession} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors focus:ring focus:ring-red-400" aria-label="Clear session" title="Clear">
               <Trash size={20} />
            </button>
          </div>
        </header>

        {/* Derived Summary */}
        <div className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-neutral-100">
           <div className="flex-1">
             <div className="text-sm text-neutral-500 font-medium">Total Active Cost</div>
             <div className="text-2xl font-bold">${derived.totalCost.toFixed(2)}</div>
           </div>
           <div className="flex-1">
             <div className="text-sm text-neutral-500 font-medium">Active Subscriptions</div>
             <div className="text-2xl font-bold">{derived.activeCount}</div>
           </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
           {['all', 'draft', 'ready', 'changed', 'quarantined', 'archived'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-3 py-1 text-sm rounded-full capitalize whitespace-nowrap transition-colors focus:ring focus:ring-black ${filterStatus === status ? 'bg-neutral-800 text-white' : 'bg-neutral-200 hover:bg-neutral-300'}`}
              >
                {status}
              </button>
           ))}
        </div>

        {/* Records List */}
        <div className="flex flex-col gap-2">
           <AnimatePresence>
             {filteredRecords.length === 0 ? (
                 <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-8 text-center text-neutral-500 bg-white rounded border border-dashed">
                    No subscriptions found.
                 </motion.div>
             ) : (
                 filteredRecords.map(record => {
                   const isSelected = selectedRecordId === record.id;
                   const rec = (isSelected && scrubbedRecordState) ? scrubbedRecordState : record;
                   return (
                   <motion.div
                     layout
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     key={rec.id}
                     onClick={() => selectRecord(rec.id)}
                     onKeyDown={(e) => { if(e.key === 'Enter') selectRecord(rec.id) }}
                     tabIndex={0}
                     role="button"
                     className={`p-4 rounded-xl border flex justify-between items-center cursor-pointer transition-all focus:ring focus:ring-black outline-none ${isSelected ? 'bg-blue-50 border-blue-200 shadow-inner' : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'}`}
                   >
                     <div>
                       <div className="font-semibold flex items-center gap-2">
                          {rec.name}
                          {rec.status === 'quarantined' && <AlertTriangle size={14} className="text-red-500" />}
                          {rec.status === 'ready' && <CheckCircle size={14} className="text-green-500" />}
                       </div>
                       <div className="text-sm text-neutral-500 flex items-center gap-1"><Clock size={12}/> Renews: {rec.renewalDate}</div>
                     </div>
                     <div className="flex items-center gap-4">
                       <span className={`px-2 py-1 text-xs rounded uppercase font-bold tracking-wide ${getStatusColor(rec.status)}`}>
                          {rec.status}
                       </span>
                       <div className="font-mono font-medium">${rec.cost.toFixed(2)}</div>
                     </div>
                   </motion.div>
                 )})
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Inspector / Timeline Surface */}
      <div className="w-full md:w-96 flex flex-col gap-4 shrink-0">
        {selectedRecordId ? (
          <div className="bg-white p-6 rounded-xl border shadow-sm flex-1 flex flex-col gap-6 sticky top-8 h-[calc(100vh-4rem)] overflow-y-auto">
             <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold">{selectedRecordId === 'new' ? 'New Record' : 'Inspector'}</h2>
                <button onClick={() => selectRecord(null)} className="p-1 hover:bg-neutral-100 rounded focus:ring focus:ring-black">
                   <X size={20} />
                </button>
             </div>

             {/* Detail view or Edit form */}
             {isEditing ? (
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-1 p-2 border rounded focus:ring focus:ring-black" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cost</label>
                    <input type="number" required step="0.01" min="0" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} className="w-full mt-1 p-2 border rounded focus:ring focus:ring-black" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Renewal Date</label>
                    <input type="date" required value={formData.renewalDate} onChange={e => setFormData({...formData, renewalDate: e.target.value})} className="w-full mt-1 p-2 border rounded focus:ring focus:ring-black" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full mt-1 p-2 border rounded focus:ring focus:ring-black">
                       <option value="draft">Draft</option>
                       <option value="ready">Ready</option>
                       <option value="changed">Changed</option>
                       <option value="quarantined">Quarantined</option>
                       <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 bg-black text-white py-2 rounded font-medium focus:ring focus:ring-black focus:ring-offset-2">Save</button>
                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-neutral-200 py-2 rounded font-medium focus:ring focus:ring-black focus:ring-offset-2">Cancel</button>
                  </div>
                </form>
             ) : (
                <div className="flex flex-col gap-4">
                   <div className="flex justify-between items-center bg-neutral-50 p-4 rounded-lg border">
                      <div>
                        <div className="text-sm text-neutral-500 font-medium">{scrubbedRecordState ? 'Scrubbed State (Preview)' : 'Current State'}</div>
                        <div className="font-bold text-lg flex items-center gap-2">
                           {displayRecord?.name}
                           <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-bold tracking-wide ${getStatusColor(displayRecord?.status || '')}`}>
                              {displayRecord?.status}
                           </span>
                        </div>
                        <div className="text-sm">Cost: ${displayRecord?.cost.toFixed(2)}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button disabled={!!scrubbedRecordState} onClick={() => {
                           if(displayRecord) {
                              setFormData({ name: displayRecord.name, cost: displayRecord.cost.toString(), renewalDate: displayRecord.renewalDate, status: displayRecord.status });
                              setIsEditing(true);
                           }
                        }} className="p-2 bg-neutral-200 rounded hover:bg-neutral-300 disabled:opacity-50" aria-label="Edit"><Edit2 size={16} /></button>
                        <button disabled={!!scrubbedRecordState} onClick={() => quarantineRecord(selectedRecordId)} className="p-2 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200 disabled:opacity-50" aria-label="Quarantine"><AlertTriangle size={16} /></button>
                        <button disabled={!!scrubbedRecordState} onClick={() => deleteRecord(selectedRecordId)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50" aria-label="Delete"><Trash size={16} /></button>
                      </div>
                   </div>

                   {/* Replay Timeline */}
                   <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2"><Play size={16} /> Replay Timeline</h3>
                      <div className="relative border-l-2 border-neutral-200 ml-3 pl-4 flex flex-col gap-4">
                         {selectedRecordHistory.map((h) => {
                            const isSelectedCheckpoint = timelineCheckpointIndex !== null && history[timelineCheckpointIndex]?.id === h.id;
                            return (
                               <div key={h.id} className="relative">
                                  <div className={`absolute -left-[21px] w-3 h-3 rounded-full top-1 transition-colors ${isSelectedCheckpoint ? 'bg-blue-500 ring-4 ring-blue-100' : 'bg-neutral-400'}`}></div>
                                  <button
                                    className={`w-full text-left p-3 border rounded-lg cursor-pointer transition-all focus:ring focus:ring-blue-500 outline-none ${isSelectedCheckpoint ? 'border-blue-500 bg-blue-50' : 'hover:border-neutral-400 bg-white'}`}
                                    onClick={() => scrubToTimelineEvent(h.id)}
                                    aria-pressed={isSelectedCheckpoint}
                                  >
                                     <div className="flex justify-between items-center mb-1">
                                       <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">{h.mutationType}</span>
                                       <span className="text-xs text-neutral-400">{new Date(h.timestamp).toLocaleTimeString()}</span>
                                     </div>
                                     <div className="text-sm">
                                        Cost: ${h.newState.cost} | Status: {h.newState.status}
                                     </div>
                                  </button>
                               </div>
                            );
                         })}
                      </div>

                      {timelineCheckpointIndex !== null && (
                         <div className="mt-6 pt-4 border-t flex gap-2">
                            <button onClick={restoreTimelineCheckpoint} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors focus:ring focus:ring-blue-500 focus:ring-offset-2">
                               Restore
                            </button>
                            <button onClick={cancelScrub} className="flex-1 bg-neutral-200 text-neutral-800 px-4 py-2 rounded font-medium hover:bg-neutral-300 transition-colors focus:ring focus:ring-neutral-500 focus:ring-offset-2">
                               Cancel
                            </button>
                         </div>
                      )}
                   </div>
                </div>
             )}

          </div>
        ) : (
          <div className="bg-neutral-100 p-8 rounded-xl border border-dashed flex-1 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Plus size={24} className="text-neutral-400" />
             </div>
             <h3 className="font-semibold text-lg mb-2">No Record Selected</h3>
             <p className="text-neutral-500 text-sm mb-6">Select a record to view its timeline or create a new one.</p>
             <button
                onClick={() => {
                   setFormData({ name: '', cost: '', renewalDate: '', status: 'draft' });
                   setIsEditing(true);
                   selectRecord('new');
                }}
                className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 transition-colors focus:ring focus:ring-black focus:ring-offset-2"
             >
                Create Record
             </button>
          </div>
        )}
      </div>

    </div>
  );
}

export default App;
