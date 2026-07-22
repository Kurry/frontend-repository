import React, { useState, useEffect } from 'react';
import { useDrillStore, STATUSES } from './store.js';
import { validateRecord, validateExportDocument } from './validation.js';
import { Download, Upload, AlertCircle, Save, X, Undo, CornerUpLeft } from 'lucide-react';

function App() {
  const { records, addRecord, updateRecord, replaceRecords, undo, history } = useDrillStore();
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [exportImportMode, setExportImportMode] = useState(null);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState(null);
  const [exportedText, setExportedText] = useState('');

  const selectedRecord = records.find(r => r.id === selectedRecordId);


  // Derived state
  const summary = {
    total: records.length,
    byStatus: STATUSES.reduce((acc, status) => {
      acc[status] = records.filter(r => r.constraintCanvasState === status).length;
      return acc;
    }, {})
  };


  // WebMCP Integration
  useEffect(() => {
    const handlers = {
      entity_create_record: async (args) => {
        const id = addRecord(args);
        return { message: "Record created", id };
      },
      entity_update_record: async (args) => {
        updateRecord(args.id, args.updates);
        return { message: "Record updated" };
      },
      artifact_export_session_json: async () => {
        const doc = {
          schemaVersion: 'evacuation-drill-v1',
          exportedAt: new Date().toISOString(),
          records: records,
          derived: { summary },
          history: history
        };
        return { content: JSON.stringify(doc) };
      },
      artifact_import_session_json: async (args) => {
        const doc = typeof args.content === 'string' ? JSON.parse(args.content) : args.content;
        const validation = validateExportDocument(doc);
        if (!validation.valid) throw new Error("Invalid import: " + JSON.stringify(validation.errors));
        replaceRecords(doc.records);
        return { message: "Import successful" };
      }
    };

    const toolMeta = [
      { name: "entity_create_record", module: "entity-collection-v1", description: "Create a drill checkpoint record.", inputSchema: { type: "object", properties: { title: { type: "string" }, location: { type: "string" }, expectedHeadcount: { type: "number" }, constraintCanvasState: { type: "string" } }, required: ["title", "location", "expectedHeadcount", "constraintCanvasState"] } },
      { name: "entity_update_record", module: "entity-collection-v1", description: "Update a drill checkpoint record.", inputSchema: { type: "object", properties: { id: { type: "string" }, updates: { type: "object" } }, required: ["id", "updates"] } },
      { name: "artifact_export_session_json", module: "artifact-transfer-v1", description: "Export the current session state as JSON.", inputSchema: { type: "object", properties: {} } },
      { name: "artifact_import_session_json", module: "artifact-transfer-v1", description: "Import a session state from JSON.", inputSchema: { type: "object", properties: { content: { type: "string" } }, required: ["content"] } },
    ];

    window.webmcp_session_info = async () => ({
      contract_version: "zto-webmcp-v1",
      modules: ["entity-collection-v1", "artifact-transfer-v1"],
      tool_names: toolMeta.map((tool) => tool.name)
    });
    window.webmcp_list_tools = async () => toolMeta;
    window.webmcp_invoke_tool = async (request, separateArguments = {}) => {
      const name = typeof request === "string" ? request : request?.name;
      const args = typeof request === "string" ? (separateArguments || {}) : (request?.arguments || request?.args || request || {});
      const handler = handlers[name];
      if (!handler) throw new Error("WebMCP tool not registered: " + name);
      return handler(args);
    };
  }, [records, addRecord, updateRecord, replaceRecords, summary, history]);

  const handleExportClick = () => {
    const doc = {
      schemaVersion: 'evacuation-drill-v1',
      exportedAt: new Date().toISOString(),
      records: records,
      derived: { summary },
      history: history
    };
    setExportedText(JSON.stringify(doc, null, 2));
    setExportImportMode('export');
  };

  const handleImportSubmit = () => {
    try {
      const doc = JSON.parse(importText);
      const validation = validateExportDocument(doc);
      if (!validation.valid) {
        setImportError(Object.values(validation.errors).join(" | "));
        return;
      }
      // Re-generate exportedAt per requirements if we were actually saving it back, but we just restore authored state
      replaceRecords(doc.records);
      setExportImportMode(null);
      setImportError(null);
      setSelectedRecordId(null);
    } catch (e) {
      setImportError("Invalid JSON.");
    }
  };

  // Keyboard shortcut for Undo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  // Drag and drop handlers
  const handleDragStart = (e, recordId) => {
    e.dataTransfer.setData('recordId', recordId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const recordId = e.dataTransfer.getData('recordId');
    if (!recordId) return;

    const record = records.find(r => r.id === recordId);
    if (!record) return;
    if (record.constraintCanvasState === newStatus) return;

    const provisionalRecord = { ...record, constraintCanvasState: newStatus, conflictReason: null };
    const validation = validateRecord(provisionalRecord);

    if (!validation.valid) {
      // Conflict
      updateRecord(recordId, {
        constraintCanvasState: 'conflict',
        conflictReason: Object.values(validation.errors).join(" ")
      });
      setSelectedRecordId(recordId);
    } else {
      updateRecord(recordId, { constraintCanvasState: newStatus, conflictReason: null });
    }
  };

  // Alternate input for moving lanes (keyboard)
  const moveLane = (recordId, currentStatus, direction) => {
    const currentIndex = STATUSES.indexOf(currentStatus);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < STATUSES.length) {
      const newStatus = STATUSES[newIndex];
      const record = records.find(r => r.id === recordId);
      const provisionalRecord = { ...record, constraintCanvasState: newStatus, conflictReason: null };
      const validation = validateRecord(provisionalRecord);

      if (!validation.valid) {
        updateRecord(recordId, {
          constraintCanvasState: 'conflict',
          conflictReason: Object.values(validation.errors).join(" ")
        });
        setSelectedRecordId(recordId);
      } else {
        updateRecord(recordId, { constraintCanvasState: newStatus, conflictReason: null });
      }
    }
  };

  const RecordEditor = () => {
    if (!selectedRecord) return <div className="p-4 text-gray-500 italic">Select a record to edit.</div>;

    const [localEdit, setLocalEdit] = useState({ ...selectedRecord });
    const [localErrors, setLocalErrors] = useState({});

    // Sync local state if selected record changes externally
    useEffect(() => {
      setLocalEdit({ ...selectedRecord });
      setLocalErrors({});
    }, [selectedRecord]);

    const handleSave = () => {
      const validation = validateRecord(localEdit);
      if (!validation.valid) {
        setLocalErrors(validation.errors);
      } else {
        // If it was in conflict and now it's valid for its state, clear conflict reason
        let finalEdit = { ...localEdit, conflictReason: null };
        updateRecord(localEdit.id, finalEdit);
        setLocalErrors({});
      }
    };

    return (
      <div className="p-4 border-t lg:border-t-0 lg:border-l bg-gray-50 flex flex-col gap-4">
        <h2 className="font-semibold text-lg">Edit Record</h2>

        {localEdit.constraintCanvasState === 'conflict' && localEdit.conflictReason && (
          <div className="bg-red-50 text-red-700 p-3 rounded text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{localEdit.conflictReason}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={localEdit.title}
            onChange={e => setLocalEdit({...localEdit, title: e.target.value})}
          />
          {localErrors.title && <p className="text-red-500 text-xs mt-1">{localErrors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={localEdit.location}
            onChange={e => setLocalEdit({...localEdit, location: e.target.value})}
          />
          {localErrors.location && <p className="text-red-500 text-xs mt-1">{localErrors.location}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Expected Headcount</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={localEdit.expectedHeadcount}
            onChange={e => setLocalEdit({...localEdit, expectedHeadcount: parseInt(e.target.value, 10) || 0})}
          />
          {localErrors.expectedHeadcount && <p className="text-red-500 text-xs mt-1">{localErrors.expectedHeadcount}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status (Lane)</label>
          <select
            className="w-full border rounded p-2"
            value={localEdit.constraintCanvasState}
            onChange={e => setLocalEdit({...localEdit, constraintCanvasState: e.target.value})}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {localErrors.constraintCanvasState && <p className="text-red-500 text-xs mt-1">{localErrors.constraintCanvasState}</p>}
        </div>

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white rounded p-2 flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <Save className="w-4 h-4" /> Save
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-gray-900">
      {/* Header */}
      <header className="flex-shrink-0 border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Emergency Drill Evacuation Planner</h1>
        <div className="flex gap-2">
          <button
            onClick={undo}
            className="p-2 border rounded hover:bg-gray-100 flex items-center gap-1"
            title="Undo (Ctrl+Z)"
          >
            <CornerUpLeft className="w-4 h-4" /> Undo
          </button>
          <button
            onClick={() => setExportImportMode('import')}
            className="p-2 border rounded hover:bg-gray-100 flex items-center gap-1"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <button
            onClick={handleExportClick}
            className="p-2 border rounded bg-gray-900 text-white hover:bg-gray-800 flex items-center gap-1"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* Left/Top: Canvas and Summary */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Summary Panel */}
          <div className="p-4 border-b bg-gray-50 shrink-0">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Derived Summary</h3>
            <div className="flex gap-4 overflow-x-auto text-sm">
              <div className="px-3 py-1 bg-gray-200 rounded-full font-medium">Total: {summary.total}</div>
              {STATUSES.map(s => (
                <div key={s} className="px-3 py-1 bg-white border rounded-full">
                  {s}: <span className="font-medium">{summary.byStatus[s]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Constraint Canvas (Lanes) */}
          <div className="flex-1 p-4 overflow-x-auto flex gap-4 bg-gray-100">
            {STATUSES.map(status => (
              <div
                key={status}
                className="w-72 flex-shrink-0 flex flex-col bg-white rounded shadow-sm border"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="p-3 border-b font-medium capitalize text-gray-700 bg-gray-50 flex justify-between items-center">
                  {status}
                  <span className="text-xs text-gray-400 font-normal">{summary.byStatus[status]}</span>
                </div>
                <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto min-h-[200px]">
                  {records.filter(r => r.constraintCanvasState === status).map(record => (
                    <div
                      key={record.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, record.id)}
                      onClick={() => setSelectedRecordId(record.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowLeft') moveLane(record.id, status, -1);
                        if (e.key === 'ArrowRight') moveLane(record.id, status, 1);
                        if (e.key === 'Enter') setSelectedRecordId(record.id);
                      }}
                      tabIndex={0}
                      className={`p-3 rounded border cursor-grab hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                        ${selectedRecordId === record.id ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'}
                        ${record.constraintCanvasState === 'conflict' ? 'bg-red-50 border-red-200' : 'bg-white'}`}
                    >
                      <div className="font-medium text-sm">{record.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{record.location}</div>
                      <div className="text-xs text-gray-400 mt-1">Headcount: {record.expectedHeadcount}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right/Bottom: Detail Panel */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col overflow-y-auto">
           <RecordEditor />
        </div>

      </div>

      {/* Export/Import Overlay */}
      {exportImportMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col overflow-hidden max-h-full">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold">
                {exportImportMode === 'export' ? 'Export Artifact' : 'Import Artifact'}
              </h2>
              <button onClick={() => setExportImportMode(null)} className="p-1 hover:bg-gray-200 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {exportImportMode === 'export' ? (
                <div>
                  <p className="text-sm text-gray-600 mb-2">This is the JSON artifact of your session.</p>
                  <textarea
                    readOnly
                    className="w-full h-96 font-mono text-sm border rounded p-2 bg-gray-50"
                    value={exportedText}
                  />
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Paste your JSON artifact here to restore a session.</p>
                  <textarea
                    className="w-full h-96 font-mono text-sm border rounded p-2"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder='{"schemaVersion": "evacuation-drill-v1", ...}'
                  />
                  {importError && (
                    <div className="mt-4 p-3 bg-red-100 text-red-800 rounded border border-red-200">
                      {importError}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setExportImportMode(null)} className="px-4 py-2 border rounded hover:bg-gray-100">
                Cancel
              </button>
              {exportImportMode === 'export' ? (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => {
                    const blob = new Blob([exportedText], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'evacuation-drill-v1-constraint-canvas.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download JSON
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={handleImportSubmit}
                >
                  Import
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
