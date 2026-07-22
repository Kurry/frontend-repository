import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Download, Upload, Plus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';

const SCHEMA_VERSION = 'v1';
const DOMAIN_STATUSES = ['draft', 'ready', 'changed', 'archived'];
const ITEMS = ['Milk', 'Eggs', 'Bread', 'Apples', 'Carrots', 'Cheese', 'Yogurt', 'Chicken'];

const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptyRecord = () => ({
  id: generateId(),
  title: '',
  status: 'draft',
  items: [],
  targetDate: new Date().toISOString().split('T')[0],
  history: [], // [{ timestamp, state, type }]
});

const App = () => {
  const [records, setRecords] = useState(() => {
      return Array.from({length: 100}).map((_, i) => ({
          id: generateId(),
          title: `Initial Restock ${i+1}`,
          status: 'ready',
          items: [{name: 'Milk', quantity: 2}],
          targetDate: new Date().toISOString().split('T')[0],
          history: []
      }));
  });
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [undoStack, setUndoStack] = useState([]);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // WebMCP Integration
  useEffect(() => {
    window.webmcp_session_info = {
      task: "eval-intelligence/frontend-planning-community-fridge-restock-planner-replay-timeline-rn-lightroom-editing",
      version: "1.0.0"
    };

    window.webmcp_list_tools = async () => {
      return [
        {
          name: "entity_create_record",
          description: "Create a new restock task record.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              status: { type: "string", enum: DOMAIN_STATUSES },
            },
            required: ["title", "status"]
          }
        },
        {
          name: "entity_update_record",
          description: "Update an existing restock task record.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              status: { type: "string", enum: DOMAIN_STATUSES },
            },
            required: ["id"]
          }
        },
        {
          name: "artifact_export_session_json",
          description: "Export the current session state as a JSON artifact.",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        },
        {
          name: "artifact_import_session_json",
          description: "Import a session state from a JSON artifact.",
          parameters: {
            type: "object",
            properties: {
              artifact: { type: "object" }
            },
            required: ["artifact"]
          }
        }
      ];
    };

    window.webmcp_invoke_tool = async (tool, args) => {
        if (tool === 'entity_create_record') {
            const newRecord = { ...createEmptyRecord(), ...args };
            setRecords(prev => [...prev, newRecord]);
            return { success: true, id: newRecord.id };
        } else if (tool === 'entity_update_record') {
            setRecords(prev => prev.map(r => r.id === args.id ? { ...r, ...args } : r));
            return { success: true };
        } else if (tool === 'artifact_export_session_json') {
            return exportSession();
        } else if (tool === 'artifact_import_session_json') {
            return importSession(args.artifact);
        }
        throw new Error(`Unknown tool: ${tool}`);
    };
  }, [records]);


  const handleCreate = () => {
    const newRecord = createEmptyRecord();
    setEditingRecord(newRecord);
  };

  const handleSave = () => {
    if (!editingRecord.title.trim()) {
      setError("Title is required");
      return;
    }
    setError(null);
    setUndoStack(prev => [...prev, [...records]]);

    if (records.find(r => r.id === editingRecord.id)) {
        setRecords(prev => prev.map(r => r.id === editingRecord.id ? editingRecord : r));
    } else {
        setRecords(prev => [...prev, editingRecord]);
    }
    setEditingRecord(null);
  };

  const handleCancel = () => {
    setEditingRecord(null);
    setError(null);
  };

  const handleDelete = (id) => {
    setUndoStack(prev => [...prev, [...records]]);
    setRecords(prev => prev.filter(r => r.id !== id));
    if (selectedRecordId === id) setSelectedRecordId(null);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setRecords(previousState);
    setUndoStack(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack]);

  const exportSession = () => {
    const sessionData = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      records: records,
      derived: {
          summary: {
              total: records.length,
              draft: records.filter(r => r.status === 'draft').length,
              ready: records.filter(r => r.status === 'ready').length,
          }
      },
      history: []
    };
    return sessionData;
  };

  const handleExportClick = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportSession(), null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "fridge-restock-v1.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importSession = (data) => {
    try {
      if (data.schemaVersion !== SCHEMA_VERSION) {
        throw new Error("Invalid schema version");
      }
      if (!Array.isArray(data.records)) {
        throw new Error("Records must be an array");
      }
      // Simple validation
      const validRecords = data.records.filter(r => r.id && r.title && DOMAIN_STATUSES.includes(r.status));
      if (validRecords.length !== data.records.length) {
          throw new Error("Some records are invalid");
      }

      setRecords(validRecords);
      setUndoStack([]); // Clear undo stack on import
      setSelectedRecordId(null);
      return { success: true };
    } catch (err) {
      console.error("Import failed:", err);
      return { success: false, error: err.message };
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const result = importSession(json);
        if (!result.success) {
            alert(`Import failed: ${result.error}`);
        }
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const selectedRecord = records.find(r => r.id === selectedRecordId);

  // Timeline Scrubber Logic
  const handleScrub = (e) => {
      if(!selectedRecord) return;
      const progress = parseFloat(e.target.value);

      setUndoStack(prev => [...prev, [...records]]);

      // Determine status based on progress (0 to 100)
      let newStatus = 'draft';
      if (progress > 25) newStatus = 'ready';
      if (progress > 50) newStatus = 'changed';
      if (progress > 75) newStatus = 'archived';

      const updatedRecord = {
          ...selectedRecord,
          status: newStatus,
          history: [...selectedRecord.history, { timestamp: new Date().toISOString(), state: newStatus, type: 'scrub' }]
      };

      setRecords(prev => prev.map(r => r.id === selectedRecord.id ? updatedRecord : r));
  };


  const filteredRecords = filterStatus === 'all'
    ? records
    : records.filter(r => r.status === filterStatus);

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center z-10 shrink-0">
        <h1 className="text-xl font-semibold text-gray-800">Restock Planner</h1>
        <div className="flex gap-4">
          <button onClick={handleUndo} disabled={undoStack.length === 0} className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 transition-colors" aria-label="Undo">
            <RotateCcw size={20} />
          </button>
          <button onClick={handleExportClick} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            <Download size={18} /> Export
          </button>
          <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            <Upload size={18} /> Import
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">

        {/* Left Panel: Collection */}
        <div className="w-full md:w-1/3 border-r border-gray-200 bg-white flex flex-col h-full overflow-hidden shrink-0">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
             <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                aria-label="Filter status"
             >
                <option value="all">All Tasks</option>
                {DOMAIN_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
             </select>
             <button onClick={handleCreate} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm">
               <Plus size={20} />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {filteredRecords.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No tasks found.</div>
             ) : (
                filteredRecords.map(record => (
                  <div
                    key={record.id}
                    onClick={() => {
                        setSelectedRecordId(record.id);
                        if(editingRecord) handleCancel();
                    }}
                    className={`p-4 border rounded cursor-pointer transition-all duration-200 ${selectedRecordId === record.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') setSelectedRecordId(record.id) }}
                  >
                     <div className="flex justify-between items-start mb-2">
                         <h3 className="font-medium truncate pr-2">{record.title}</h3>
                         <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                            record.status === 'draft' ? 'bg-gray-200 text-gray-700' :
                            record.status === 'ready' ? 'bg-green-100 text-green-800' :
                            record.status === 'changed' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                         }`}>
                             {record.status}
                         </span>
                     </div>
                     <div className="text-sm text-gray-500">
                         {record.targetDate}
                     </div>
                  </div>
                ))
             )}
          </div>
        </div>

        {/* Right Panel: Editor & Timeline */}
        <div className="w-full md:w-2/3 bg-gray-50 flex flex-col h-full overflow-y-auto">
           {editingRecord ? (
              <div className="p-6 md:p-8 m-4 md:m-8 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold mb-6">{editingRecord.id ? 'Edit Task' : 'New Task'}</h2>
                  {error && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 rounded flex items-center gap-2">
                          <AlertCircle size={18} /> {error}
                      </div>
                  )}
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                              type="text"
                              value={editingRecord.title}
                              onChange={e => setEditingRecord({...editingRecord, title: e.target.value})}
                              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="e.g. Weekend Dairy Restock"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                              value={editingRecord.status}
                              onChange={e => setEditingRecord({...editingRecord, status: e.target.value})}
                              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                              {DOMAIN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                      </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                          <input
                              type="date"
                              value={editingRecord.targetDate}
                              onChange={e => setEditingRecord({...editingRecord, targetDate: e.target.value})}
                              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                      </div>
                  </div>
                  <div className="mt-8 flex gap-3">
                      <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
                          <Check size={18} /> Save
                      </button>
                      <button onClick={handleCancel} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2">
                          <X size={18} /> Cancel
                      </button>
                  </div>
              </div>
           ) : selectedRecord ? (
              <div className="flex-1 flex flex-col p-4 md:p-8 space-y-6">
                 {/* Inspector */}
                 <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedRecord.title}</h2>
                            <p className="text-gray-500">ID: {selectedRecord.id} &bull; Date: {selectedRecord.targetDate}</p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setEditingRecord(selectedRecord)} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Edit">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDelete(selectedRecord.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                 </div>

                 {/* Replay Timeline Surface (The Signature Interaction) */}
                 <div className="bg-gray-900 text-white p-6 md:p-8 rounded-lg shadow-xl shrink-0 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-4 left-4 flex gap-2 items-center">
                        <div className={`w-3 h-3 rounded-full ${
                             selectedRecord.status === 'draft' ? 'bg-gray-400' :
                             selectedRecord.status === 'ready' ? 'bg-green-500' :
                             selectedRecord.status === 'changed' ? 'bg-yellow-500' :
                             'bg-red-500'
                        } transition-colors duration-300`}></div>
                        <span className="text-sm font-medium uppercase tracking-wider text-gray-300">
                             {selectedRecord.status}
                        </span>
                    </div>

                    <div className="text-center mt-8 mb-12">
                        <h3 className="text-3xl font-light tracking-wide opacity-90 transition-all duration-300 transform scale-100">
                             State Progression
                        </h3>
                    </div>

                    <div className="w-full max-w-2xl mx-auto space-y-8">
                        <div className="flex justify-between text-xs font-mono text-gray-400 px-2">
                             <span>DRAFT</span>
                             <span>READY</span>
                             <span>CHANGED</span>
                             <span>ARCHIVED</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={
                                selectedRecord.status === 'draft' ? 12.5 :
                                selectedRecord.status === 'ready' ? 37.5 :
                                selectedRecord.status === 'changed' ? 62.5 :
                                87.5
                            }
                            onChange={handleScrub}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                            aria-label="Scrub through timeline"
                        />
                        <div className="flex justify-center gap-4 text-gray-400">
                            <button className="p-3 rounded-full hover:bg-gray-800 hover:text-white transition-colors"><SkipBack size={20} /></button>
                            <button className="p-3 rounded-full hover:bg-gray-800 hover:text-white transition-colors"><Play size={20} /></button>
                            <button className="p-3 rounded-full hover:bg-gray-800 hover:text-white transition-colors"><SkipForward size={20} /></button>
                        </div>
                    </div>
                 </div>

                 {/* Linked Summary (Reacts immediately) */}
                 <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm flex-1">
                     <h3 className="font-semibold text-gray-800 mb-4">Derived Summary</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="p-4 bg-gray-50 rounded text-center">
                             <div className="text-2xl font-bold text-gray-900">{records.length}</div>
                             <div className="text-xs text-gray-500 uppercase">Total Tasks</div>
                         </div>
                         <div className="p-4 bg-gray-50 rounded text-center">
                             <div className="text-2xl font-bold text-gray-900">{records.filter(r => r.status === 'draft').length}</div>
                             <div className="text-xs text-gray-500 uppercase">Drafts</div>
                         </div>
                         <div className="p-4 bg-gray-50 rounded text-center">
                             <div className="text-2xl font-bold text-gray-900">{records.filter(r => r.status === 'ready').length}</div>
                             <div className="text-xs text-gray-500 uppercase">Ready</div>
                         </div>
                         <div className="p-4 bg-gray-50 rounded text-center">
                             <div className="text-2xl font-bold text-gray-900">{records.filter(r => r.status === 'changed' || r.status === 'archived').length}</div>
                             <div className="text-xs text-gray-500 uppercase">Other</div>
                         </div>
                     </div>
                 </div>

              </div>
           ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 p-8 text-center">
                  Select a task to view details or start scrubbing through its timeline.
              </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default App;
