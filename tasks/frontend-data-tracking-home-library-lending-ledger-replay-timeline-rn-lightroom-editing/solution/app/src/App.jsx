import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, Undo, Activity, AlertCircle, X, ChevronRight, Plus, Trash2, Filter, ArrowDownUp } from 'lucide-react';
import { format } from 'date-fns';

const SCHEMA_VERSION = 'v1';

const generateSeedData = () => {
  const records = [];
  const statuses = ['empty', 'draft', 'ready', 'changed', 'archived'];
  const authors = ['Ursula K. Le Guin', 'Isaac Asimov', 'Frank Herbert', 'Octavia Butler', 'Arthur C. Clarke'];

  for (let i = 1; i <= 100; i++) {
    const status = statuses[i % statuses.length];

    const record = {
      id: `book-${i}`,
      title: `Book Title ${i}`,
      author: authors[i % authors.length],
      status: status,
      rating: (i % 5) + 1,
      borrowedBy: i % 10 === 0 ? 'Alice' : (i % 15 === 0 ? 'Bob' : ''),
      timelineState: {
        checkpoints: [
          { status: 'empty', timestamp: new Date(Date.now() - 10000000).toISOString() },
          { status, timestamp: new Date().toISOString() }
        ],
        currentCheckpointIndex: 1
      }
    };
    records.push(record);
  }
  return records;
};

const initialState = {
  schemaVersion: SCHEMA_VERSION,
  exportedAt: null,
  records: generateSeedData(),
  derived: { summary: { total: 100, active: 80, archived: 20 } },
  history: []
};

// WebMCP Tool Handlers
const tools = [
  {
    name: 'editor_select',
    description: 'Selects an editor object (checkpoint).',
    inputSchema: {
      type: 'object',
      properties: {
        record_id: { type: 'string' },
        checkpoint_index: { type: 'number' }
      },
      required: ['record_id', 'checkpoint_index']
    }
  },
  {
    name: 'editor_update_property',
    description: 'Update a property in the editor.',
    inputSchema: {
      type: 'object',
      properties: {
        record_id: { type: 'string' },
        property: { type: 'string' },
        value: { type: 'string' }
      },
      required: ['record_id', 'property', 'value']
    }
  },
  {
    name: 'editor_switch_mode',
    description: 'Switches the editor mode (edit/replay).',
    inputSchema: {
      type: 'object',
      properties: { mode: { type: 'string', enum: ['edit', 'replay'] } },
      required: ['mode']
    }
  },
  {
    name: 'entity_create',
    description: 'Create a new book record.',
    inputSchema: {
      type: 'object',
      properties: { title: { type: 'string' }, author: { type: 'string' }, status: { type: 'string', enum: ['empty', 'draft', 'ready', 'changed', 'archived'] } },
      required: ['title', 'author', 'status']
    }
  },
  {
    name: 'entity_select',
    description: 'Select a book record.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id']
    }
  },
  {
    name: 'entity_update',
    description: 'Update a book record.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, title: { type: 'string' }, status: { type: 'string' } },
      required: ['id']
    }
  },
  {
    name: 'entity_delete',
    description: 'Delete a book record.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, confirm: { type: 'boolean' } },
      required: ['id', 'confirm']
    }
  },
  {
    name: 'artifact_export',
    description: 'Export artifact.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'artifact_import',
    description: 'Import artifact.',
    inputSchema: {
      type: 'object',
      properties: { data: { type: 'string' } },
      required: ['data']
    }
  }
];

export default function App() {
  const [session, setSession] = useState(initialState);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [activeMode, setActiveMode] = useState('edit'); // 'edit', 'replay'
  const [errorMap, setErrorMap] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('title_asc'); // title_asc, title_desc, rating_desc
  const fileInputRef = useRef(null);

  const selectedRecord = session.records.find(r => r.id === selectedRecordId);

  // Derived state computation
  useEffect(() => {
    const total = session.records.length;
    const active = session.records.filter(r => r.status !== 'archived').length;
    const archived = session.records.filter(r => r.status === 'archived').length;

    if (
      session.derived.summary.total !== total ||
      session.derived.summary.active !== active ||
      session.derived.summary.archived !== archived
    ) {
      setSession(prev => ({
        ...prev,
        derived: { summary: { total, active, archived } }
      }));
    }
  }, [session.records]);

  // Expose WebMCP Contracts
  useEffect(() => {
    window.webmcp_list_tools = async () => tools;

    window.webmcp_session_info = async () => ({
      task_id: "eval-intelligence/frontend-data-tracking-home-library-lending-ledger-replay-timeline-rn-lightroom-editing",
      session_state: session,
      ui_state: {
        selectedRecordId,
        activeMode,
        filterStatus,
        sortOrder
      }
    });

    window.webmcp_invoke_tool = async (name, args) => {
      if (name === 'editor_switch_mode') {
        setActiveMode(args.mode);
        return { success: true };
      }
      if (name === 'entity_select') {
        setSelectedRecordId(args.id);
        return { success: true };
      }
      if (name === 'entity_create') {
        createRecord({ title: args.title, author: args.author, status: args.status });
        return { success: true };
      }
      if (name === 'entity_update') {
         updateRecord(args.id, args);
         return { success: true };
      }
      if (name === 'editor_select') {
         restoreCheckpoint(args.record_id, args.checkpoint_index);
         return { success: true };
      }
      if (name === 'entity_delete') {
         if (args.confirm) {
           deleteRecord(args.id);
           return { success: true };
         } else {
           throw new Error('confirm required for delete');
         }
      }
      if (name === 'artifact_export') {
        const exportData = {
          ...session,
          exportedAt: new Date().toISOString()
        };
        setSession(exportData);
        return { artifact: exportData };
      }
      if (name === 'artifact_import') {
        try {
          const data = typeof args.data === 'string' ? JSON.parse(args.data) : args.data;
          validateAndImport(data);
          return { success: true };
        } catch (e) {
          throw new Error('Import failed: ' + e.message);
        }
      }
      return { success: false, reason: 'unimplemented tool handler' };
    };
  }, [session, selectedRecordId, activeMode, filterStatus, sortOrder]);

  const handleExport = () => {
    const exportData = {
      ...session,
      exportedAt: new Date().toISOString()
    };
    setSession(exportData);

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library-lending-v1-replay-timeline.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAndImport = () => {
    fileInputRef.current.click();
  };

  const validateAndImport = (data) => {
    if (data.schemaVersion !== SCHEMA_VERSION) {
      throw new Error('Invalid schema version');
    }
    if (!data.records || !Array.isArray(data.records)) {
      throw new Error('Missing or invalid records array');
    }

    const ids = new Set();
    const allowedStatuses = ['empty', 'draft', 'ready', 'changed', 'archived'];
    data.records.forEach(r => {
      if (ids.has(r.id)) throw new Error('Duplicate record ID found: ' + r.id);
      ids.add(r.id);

      if (!allowedStatuses.includes(r.status)) throw new Error(`Invalid status enum for record ${r.id}: ${r.status}`);
      if (typeof r.rating !== 'number' || r.rating < 1 || r.rating > 5) throw new Error(`Invalid rating for record ${r.id}`);
    });

    setSession({
      ...data,
      exportedAt: new Date().toISOString()
    });
    setErrorMap({});
    setSelectedRecordId(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        validateAndImport(data);
        e.target.value = '';
      } catch (err) {
        setErrorMap({ import: err.message });
      }
    };
    reader.readAsText(file);
  };

  const createRecord = (newProps = {}) => {
    setSession(prev => {
      const newId = `book-new-${Date.now()}`;
      const status = newProps.status || 'draft';
      const record = {
        id: newId,
        title: newProps.title || 'New Book Title',
        author: newProps.author || 'Author Name',
        status: status,
        rating: 1,
        borrowedBy: '',
        timelineState: {
          checkpoints: [
            { status: 'empty', timestamp: new Date().toISOString() },
            { status: status, timestamp: new Date().toISOString() }
          ],
          currentCheckpointIndex: 1
        }
      };

      const newHistory = [...prev.history, { action: 'create', target: newId, prevState: null }];
      return {
        ...prev,
        records: [record, ...prev.records],
        history: newHistory
      };
    });
  };

  const deleteRecord = (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    setSession(prev => {
      const prevRecord = prev.records.find(r => r.id === id);
      const newHistory = [...prev.history, { action: 'delete', target: id, prevState: JSON.parse(JSON.stringify(prevRecord)) }];
      return {
        ...prev,
        records: prev.records.filter(r => r.id !== id),
        history: newHistory
      };
    });
    if (selectedRecordId === id) setSelectedRecordId(null);
  };

  const updateRecord = (id, updates) => {
    setSession(prev => {
      const prevRecord = prev.records.find(r => r.id === id);
      const newHistory = [...prev.history, { action: 'update', target: id, prevState: JSON.parse(JSON.stringify(prevRecord)) }];

      const newRecords = prev.records.map(r => {
        if (r.id !== id) return r;
        const newR = { ...r, ...updates };

        if (updates.status && updates.status !== r.status) {
          const checkPoint = { status: updates.status, timestamp: new Date().toISOString() };
          newR.timelineState = {
            checkpoints: [...(r.timelineState?.checkpoints || []), checkPoint],
            currentCheckpointIndex: (r.timelineState?.checkpoints?.length || 0)
          };
        }
        return newR;
      });

      return {
        ...prev,
        records: newRecords,
        history: newHistory
      };
    });
  };

  const handleUndo = () => {
    setSession(prev => {
      if (prev.history.length === 0) return prev;

      const lastAction = prev.history[prev.history.length - 1];
      const newHistory = prev.history.slice(0, -1);

      if (lastAction.action === 'update') {
        const newRecords = prev.records.map(r =>
          r.id === lastAction.target ? lastAction.prevState : r
        );
        return { ...prev, records: newRecords, history: newHistory };
      }
      if (lastAction.action === 'delete') {
        return { ...prev, records: [lastAction.prevState, ...prev.records], history: newHistory };
      }
      if (lastAction.action === 'create') {
        return { ...prev, records: prev.records.filter(r => r.id !== lastAction.target), history: newHistory };
      }
      return prev;
    });
  };

  const restoreCheckpoint = (recordId, checkpointIndex) => {
     setSession(prev => {
       const prevRecord = prev.records.find(r => r.id === recordId);
       const newHistory = [...prev.history, { action: 'update', target: recordId, prevState: JSON.parse(JSON.stringify(prevRecord)) }];

       const newRecords = prev.records.map(r => {
         if (r.id !== recordId) return r;
         const targetCheckpoint = r.timelineState.checkpoints[checkpointIndex];
         return {
           ...r,
           status: targetCheckpoint.status,
           timelineState: {
             ...r.timelineState,
             currentCheckpointIndex: checkpointIndex
           }
         };
       });

       return {
         ...prev,
         records: newRecords,
         history: newHistory
       };
     });
  };

  // Filter & Sort Logic
  const filteredRecords = session.records.filter(r => filterStatus === 'all' || r.status === filterStatus);
  const sortedAndFilteredRecords = filteredRecords.sort((a, b) => {
    if (sortOrder === 'title_asc') return a.title.localeCompare(b.title);
    if (sortOrder === 'title_desc') return b.title.localeCompare(a.title);
    if (sortOrder === 'rating_desc') return b.rating - a.rating;
    return 0;
  });

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-600" />
          Home Library Lending Ledger
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-500 font-medium">
            Total: {session.derived.summary.total} | Active: {session.derived.summary.active} | Archived: {session.derived.summary.archived}
          </div>
          <button
            onClick={handleUndo}
            disabled={session.history.length === 0}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-50"
            title="Undo Last Action"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={() => createRecord()}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
          >
            <Plus className="w-4 h-4" />
            Add Book
          </button>
          <button
            onClick={handleClearAndImport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".json"
          />
        </div>
      </header>

      {errorMap.import && (
        <div className="bg-red-50 text-red-700 px-6 py-3 border-b border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>Import failed: {errorMap.import}</span>
          </div>
          <button onClick={() => setErrorMap({})} className="text-red-500 hover:text-red-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-3 bg-white border-b border-slate-200 flex gap-4 items-center">
             <div className="flex items-center gap-2">
               <Filter className="w-4 h-4 text-slate-500" />
               <select
                 value={filterStatus}
                 onChange={e => setFilterStatus(e.target.value)}
                 className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-400"
               >
                 <option value="all">All Statuses</option>
                 <option value="empty">Empty</option>
                 <option value="draft">Draft</option>
                 <option value="ready">Ready</option>
                 <option value="changed">Changed</option>
                 <option value="archived">Archived</option>
               </select>
             </div>
             <div className="flex items-center gap-2">
               <ArrowDownUp className="w-4 h-4 text-slate-500" />
               <select
                 value={sortOrder}
                 onChange={e => setSortOrder(e.target.value)}
                 className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-400"
               >
                 <option value="title_asc">Title (A-Z)</option>
                 <option value="title_desc">Title (Z-A)</option>
                 <option value="rating_desc">Highest Rated</option>
               </select>
             </div>
             <div className="text-sm text-slate-500 ml-auto">
                Showing {sortedAndFilteredRecords.length} records
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
               {sortedAndFilteredRecords.map(record => (
                 <div
                   key={record.id}
                   onClick={() => setSelectedRecordId(record.id)}
                   className={`p-4 bg-white rounded-lg border-2 cursor-pointer transition-all ${
                     selectedRecordId === record.id ? 'border-indigo-500 shadow-md transform scale-[1.02]' : 'border-slate-200 hover:border-slate-300'
                   }`}
                 >
                   <h3 className="font-semibold text-slate-800 truncate">{record.title}</h3>
                   <p className="text-sm text-slate-500 truncate">{record.author}</p>
                   <div className="mt-3 flex items-center justify-between">
                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                       record.status === 'ready' ? 'bg-green-100 text-green-700' :
                       record.status === 'archived' ? 'bg-slate-100 text-slate-700' :
                       record.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                       record.status === 'changed' ? 'bg-blue-100 text-blue-700' :
                       'bg-gray-100 text-gray-700'
                     }`}>
                       {record.status}
                     </span>
                     {record.borrowedBy && (
                       <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md truncate max-w-[50%]">
                         Out: {record.borrowedBy}
                       </span>
                     )}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div className="w-96 bg-white border-l border-slate-200 flex flex-col z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
          {selectedRecord ? (
            <div className="p-6 flex flex-col h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold truncate pr-2">{selectedRecord.title}</h2>
                <div className="flex bg-slate-100 rounded-md p-1 shrink-0">
                  <button
                    onClick={() => setActiveMode('edit')}
                    className={`px-3 py-1.5 text-xs font-medium rounded ${activeMode === 'edit' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setActiveMode('replay')}
                    className={`px-3 py-1.5 text-xs font-medium rounded ${activeMode === 'replay' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Timeline
                  </button>
                </div>
              </div>

              {activeMode === 'edit' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={selectedRecord.title}
                      onChange={e => updateRecord(selectedRecord.id, { title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
                    <input
                      type="text"
                      value={selectedRecord.author}
                      onChange={e => updateRecord(selectedRecord.id, { author: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                      value={selectedRecord.status}
                      onChange={e => updateRecord(selectedRecord.id, { status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                    >
                      <option value="empty">Empty</option>
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="changed">Changed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Borrowed By</label>
                    <input
                      type="text"
                      value={selectedRecord.borrowedBy || ''}
                      onChange={e => updateRecord(selectedRecord.id, { borrowedBy: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rating (1-5)</label>
                    <input
                      type="number"
                      min="1" max="5"
                      value={selectedRecord.rating}
                      onChange={e => updateRecord(selectedRecord.id, { rating: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-200">
                    <button
                      onClick={() => deleteRecord(selectedRecord.id)}
                      className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Book
                    </button>
                  </div>
                </div>
              )}

              {activeMode === 'replay' && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-2">Replay Timeline</h3>
                    <p className="text-xs text-slate-500 mb-6">Scrub along the timeline to restore a prior checkpoint.</p>

                    <div className="relative py-4">
                      <div className="absolute h-1 bg-slate-200 w-full top-1/2 -translate-y-1/2 rounded-full"></div>

                      <div className="flex justify-between relative z-10">
                        {selectedRecord.timelineState.checkpoints.map((cp, idx) => (
                          <div key={idx} className="flex flex-col items-center group cursor-pointer" onClick={() => restoreCheckpoint(selectedRecord.id, idx)}>
                            <button
                              className={`w-5 h-5 rounded-full border-[3px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                                selectedRecord.timelineState.currentCheckpointIndex === idx
                                ? 'bg-indigo-600 border-indigo-200 scale-125'
                                : 'bg-white border-slate-300 group-hover:border-indigo-400'
                              }`}
                              title={`Restore to ${cp.status}`}
                            />
                            <div className={`mt-3 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                                selectedRecord.timelineState.currentCheckpointIndex === idx ? 'text-indigo-700' : 'text-slate-500 group-hover:text-slate-800'
                            }`}>
                              {cp.status}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              {format(new Date(cp.timestamp), 'HH:mm')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                       <Activity className="w-4 h-4 text-indigo-500" />
                       <h4 className="text-sm font-semibold text-slate-800">Current State Overview</h4>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm bg-slate-50 p-3 rounded-md">
                      <dt className="text-slate-500">Status:</dt>
                      <dd className="font-medium text-slate-900 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                        {selectedRecord.status}
                      </dd>
                      <dt className="text-slate-500">Checkpoint Date:</dt>
                      <dd className="font-medium text-slate-900 truncate" title={selectedRecord.timelineState.checkpoints[selectedRecord.timelineState.currentCheckpointIndex].timestamp}>
                        {format(new Date(selectedRecord.timelineState.checkpoints[selectedRecord.timelineState.currentCheckpointIndex].timestamp), 'MMM d, yyyy')}
                      </dd>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <ChevronRight className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-slate-500 text-sm">Select a book from the ledger on the left to inspect or edit its details and replay timeline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
