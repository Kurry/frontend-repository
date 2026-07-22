import { useState } from 'react';
import { useStore, type PhotoSequenceRecord } from './store';
import { useWebMCP } from './WebMCP';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, FileUp, Folder, Image as ImageIcon, CheckCircle, Clock, Undo2, Edit2, Archive, ListPlus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const statusIcons = {
  draft: <Clock className="w-4 h-4 text-gray-500" />,
  ready: <CheckCircle className="w-4 h-4 text-green-500" />,
  changed: <Edit2 className="w-4 h-4 text-blue-500" />,
  archived: <Archive className="w-4 h-4 text-red-500" />,
};

function App() {
  useWebMCP();
  const store = useStore();
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Drawer states for mobile
  const [showSummary, setShowSummary] = useState(false);
  const [showInspector, setShowInspector] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState<Partial<PhotoSequenceRecord>>({});
  const [errorMsg, setErrorMsg] = useState('');

  const handleEditChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = (id: string) => {
    if (!editForm.title || editForm.title.trim().length === 0) {
      setErrorMsg('Title is required');
      return;
    }
    setErrorMsg('');
    store.updateRecord(id, editForm);
    setEditingRecordId(null);
  };

  const selectedRecord = store.records.find(r => r.id === selectedRecordId);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <ImageIcon className="w-6 h-6" />
          Caption Loom
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => store.undo()}
            disabled={store.past.length === 0}
            className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-md disabled:opacity-50 transition-colors"
            aria-label="Undo"
          >
            <Undo2 className="w-5 h-5" />
          </button>

          <div className="flex border rounded-md overflow-hidden bg-white ml-4">
            <button
              onClick={() => {
                const text = JSON.stringify(store.exportSession(), null, 2);
                const blob = new Blob([text], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'photo-caption-v1-scenario-weaver.json';
                a.click();
              }}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 text-sm font-medium transition-colors border-r"
            >
              <FileDown className="w-4 h-4" /> Export
            </button>
            <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 text-sm font-medium cursor-pointer transition-colors">
              <FileUp className="w-4 h-4" /> Import
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const json = JSON.parse(ev.target?.result as string);
                        store.importSession(json);
                      } catch(e) {
                         alert('Invalid JSON');
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>

          <div className="md:hidden flex gap-2 ml-2">
             <button onClick={() => setShowSummary(true)} className="px-3 py-1.5 bg-neutral-200 rounded-md text-sm font-medium">Summary</button>
             <button onClick={() => setShowInspector(true)} className="px-3 py-1.5 bg-neutral-200 rounded-md text-sm font-medium">Inspector</button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Main Work Surface */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold">Photo Sequences</h2>
                <p className="text-neutral-500">Manage, organize, and branch your scenarios.</p>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                onClick={() => store.addRecord({ title: 'New Sequence', caption: '', sequenceOrder: store.records.length + 1, status: 'draft', folder: 'inbox', queueState: 'idle' })}
              >
                <ListPlus className="w-4 h-4" /> Add Record
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b">
                     <th className="p-3 w-12 text-center text-sm font-medium text-neutral-500">#</th>
                     <th className="p-3 text-sm font-medium text-neutral-500">Title</th>
                     <th className="p-3 text-sm font-medium text-neutral-500">Folder</th>
                     <th className="p-3 text-sm font-medium text-neutral-500">Status</th>
                     <th className="p-3 text-right text-sm font-medium text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {store.records.map((record) => (
                      <motion.tr
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={record.id}
                        className={cn(
                          "border-b last:border-0 hover:bg-neutral-50 transition-colors cursor-pointer",
                          selectedRecordId === record.id && "bg-blue-50/50"
                        )}
                        onClick={() => setSelectedRecordId(record.id)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setSelectedRecordId(record.id);
                        }}
                      >
                        <td className="p-3 text-center text-neutral-400 font-mono text-sm">{record.sequenceOrder}</td>
                        <td className="p-3">
                           {editingRecordId === record.id ? (
                             <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                               <input
                                 className="border rounded p-1 w-full text-sm"
                                 value={editForm.title || ''}
                                 onChange={e => handleEditChange('title', e.target.value)}
                               />
                               {errorMsg && <span className="text-red-500 text-xs">{errorMsg}</span>}
                               <button
                                 className="bg-blue-500 text-white text-xs px-2 py-1 rounded w-fit"
                                 onClick={() => handleSaveEdit(record.id)}
                               >Save</button>
                             </div>
                           ) : (
                             <div>
                                <div className="font-medium">{record.title}</div>
                                <div className="text-sm text-neutral-500 truncate max-w-xs">{record.caption}</div>
                             </div>
                           )}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-100 text-xs font-medium text-neutral-600">
                             <Folder className="w-3 h-3" /> {record.folder}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="flex items-center gap-2 text-sm capitalize">
                            {statusIcons[record.status]} {record.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                             className="text-neutral-400 hover:text-neutral-700 p-1"
                             onClick={(e) => {
                               e.stopPropagation();
                               setEditingRecordId(record.id);
                               setEditForm(record);
                             }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {store.records.length === 0 && (
                     <tr>
                        <td colSpan={5} className="p-8 text-center text-neutral-400">
                           No sequences found. Create one to begin.
                        </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Scenario Weaver Component */}
            <div className="mt-8 bg-neutral-900 rounded-xl p-6 text-white shadow-lg border border-neutral-800">
               <h3 className="text-xl font-bold mb-2 text-blue-400">Scenario Weaver</h3>
               <p className="text-neutral-400 mb-6 text-sm">Branch a selected record into a scenario and compare linked outcomes.</p>

               {selectedRecord ? (
                 <div className="space-y-4">
                    <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700 flex justify-between items-center">
                       <div>
                          <div className="font-medium text-lg">{selectedRecord.title}</div>
                          <div className="text-neutral-400 text-sm">Status: {selectedRecord.status} | Order: {selectedRecord.sequenceOrder}</div>
                       </div>

                       <div className="flex gap-2">
                         <button
                           className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md font-medium text-sm transition-colors"
                           onClick={() => store.branchScenario(selectedRecord.id, 'Alt-Timeline')}
                         >
                           Branch: Alt-Timeline
                         </button>
                         <button
                           className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md font-medium text-sm transition-colors"
                           onClick={() => store.branchScenario(selectedRecord.id, 'Approved-Cut')}
                         >
                           Branch: Approved-Cut
                         </button>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="p-8 text-center border border-dashed border-neutral-700 rounded-lg text-neutral-500">
                    Select a record from the collection to weave a scenario.
                 </div>
               )}
            </div>
          </div>
        </main>

        {/* Right Sidebar: Summary & History (Desktop) */}
        <aside className="hidden md:flex w-80 border-l bg-white flex-col">
          <div className="p-4 border-b">
             <h3 className="font-semibold text-sm uppercase tracking-wider text-neutral-500 mb-4">Derived Summary</h3>
             <div className="space-y-3">
               <div className="flex justify-between text-sm">
                 <span className="text-neutral-600">Total Records</span>
                 <span className="font-medium">{store.derived.totalRecords}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-neutral-600">Draft</span>
                 <span className="font-medium">{store.derived.draftCount}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-neutral-600">Ready</span>
                 <span className="font-medium">{store.derived.readyCount}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-neutral-600">Changed</span>
                 <span className="font-medium">{store.derived.changedCount}</span>
               </div>
             </div>
             {store.derived.lastDecision && (
               <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-md border border-blue-100">
                 <div className="font-medium mb-1">Last Decision</div>
                 {store.derived.lastDecision}
               </div>
             )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
             <h3 className="font-semibold text-sm uppercase tracking-wider text-neutral-500 mb-4">Event History</h3>
             <div className="space-y-4">
                {store.history.slice().reverse().map((event) => (
                  <div key={event.id} className="text-sm">
                     <div className="font-medium text-neutral-700">{event.action}</div>
                     <div className="text-xs text-neutral-400">{new Date(event.timestamp).toLocaleTimeString()}</div>
                  </div>
                ))}
                {store.history.length === 0 && <div className="text-sm text-neutral-400">No events yet.</div>}
             </div>
          </div>
        </aside>

        {/* Mobile Drawers */}
        <AnimatePresence>
          {showSummary && (
             <motion.div
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
               className="md:hidden fixed inset-x-0 bottom-0 top-20 bg-white shadow-2xl z-20 flex flex-col p-4"
             >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Derived Summary</h3>
                  <button className="text-neutral-500 font-bold" onClick={() => setShowSummary(false)}>Close</button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-base">
                    <span className="text-neutral-600">Total Records</span>
                    <span className="font-medium">{store.derived.totalRecords}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-neutral-600">Draft</span>
                    <span className="font-medium">{store.derived.draftCount}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-neutral-600">Ready</span>
                    <span className="font-medium">{store.derived.readyCount}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-neutral-600">Changed</span>
                    <span className="font-medium">{store.derived.changedCount}</span>
                  </div>
                </div>
                {store.derived.lastDecision && (
                  <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-md border border-blue-100">
                    <div className="font-medium mb-1">Last Decision</div>
                    {store.derived.lastDecision}
                  </div>
                )}
             </motion.div>
          )}

          {showInspector && (
             <motion.div
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
               className="md:hidden fixed inset-0 bg-white shadow-2xl z-30 flex flex-col p-4 pt-16"
             >
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                  <h3 className="font-bold text-lg">Event History</h3>
                  <button className="text-neutral-500 font-bold px-3 py-1 bg-neutral-100 rounded" onClick={() => setShowInspector(false)}>Close</button>
                </div>
                <div className="space-y-4 overflow-y-auto flex-1">
                  {store.history.slice().reverse().map((event) => (
                    <div key={event.id} className="text-sm pb-2 border-b border-neutral-100">
                       <div className="font-medium text-neutral-800 text-base">{event.action}</div>
                       <div className="text-xs text-neutral-500">{new Date(event.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))}
                  {store.history.length === 0 && <div className="text-sm text-neutral-400">No events yet.</div>}
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
