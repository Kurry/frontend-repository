import React, { useState, useEffect, useRef } from 'react';
import { CameraRecord, RecordStatus, StoryboardCameraPathEditorSession } from './types';
import { Plus, Trash2, Edit2, AlertCircle, CheckCircle2, Download, Upload, RefreshCcw, Undo2, Archive, Camera } from 'lucide-react';
import { WebMCP } from './webmcp';

const INITIAL_STATE: StoryboardCameraPathEditorSession = {
  schemaVersion: 'v1',
  exportedAt: new Date().toISOString(),
  records: [
    { id: 'rec-1', name: 'Opening Shot', tag: 'scene-1', status: 'ready', cells: 10, auditLensState: 'idle' },
    { id: 'rec-2', name: 'Pan across room', tag: 'scene-1', status: 'empty', cells: 0, auditLensState: 'idle' },
    { id: 'rec-3', name: 'Close up subject', tag: 'scene-2', status: 'draft', cells: 5, auditLensState: 'idle', position: 45, angle: 90 },
  ],
  derived: {
    summary: { totalRecords: 3, readyRecords: 1, archivedRecords: 0, conflicts: 0 }
  },
  history: []
};

export default function App() {
  const [session, setSession] = useState<StoryboardCameraPathEditorSession>(INITIAL_STATE);
  const [pastSessions, setPastSessions] = useState<StoryboardCameraPathEditorSession[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RecordStatus | 'all'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CameraRecord>>({});
  const [errorMsg, setErrorMsg] = useState('');
  const [auditLensMode, setAuditLensMode] = useState(false);

  // Undo support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pastSessions]);

  const saveState = (newState: StoryboardCameraPathEditorSession) => {
    setPastSessions(prev => [...prev, session]);

    // Update derived state
    const readyRecords = newState.records.filter(r => r.status === 'ready').length;
    const archivedRecords = newState.records.filter(r => r.status === 'archived').length;
    const conflicts = newState.records.filter(r => r.auditLensState === 'conflict').length;

    newState.derived.summary = {
      totalRecords: newState.records.length,
      readyRecords,
      archivedRecords,
      conflicts
    };

    setSession(newState);
  };

  const handleUndo = () => {
    if (pastSessions.length > 0) {
      const previousState = pastSessions[pastSessions.length - 1];
      setPastSessions(prev => prev.slice(0, -1));
      setSession(previousState);
    }
  };

  const addHistoryEvent = (action: string, recordId?: string, details: string = '') => {
    return {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      recordId,
      details
    };
  };

  const handleCreateRecord = () => {
    const newRecord: CameraRecord = {
      id: `rec-${Date.now()}`,
      name: 'New Shot',
      tag: 'new',
      status: 'empty',
      cells: 0,
      auditLensState: 'idle'
    };

    const newState = { ...session };
    newState.records = [...newState.records, newRecord];
    newState.history = [...newState.history, addHistoryEvent('CREATE_RECORD', newRecord.id)];
    saveState(newState);
    setSelectedRecordId(newRecord.id);
    setEditForm(newRecord);
    setIsEditing(true);
  };

  const handleDeleteRecord = (id: string) => {
    const newState = { ...session };
    newState.records = newState.records.filter(r => r.id !== id);
    newState.history = [...newState.history, addHistoryEvent('DELETE_RECORD', id)];
    saveState(newState);
    if (selectedRecordId === id) setSelectedRecordId(null);
  };

  const handleArchiveRecord = (id: string) => {
    const newState = { ...session };
    const recordIndex = newState.records.findIndex(r => r.id === id);
    if (recordIndex >= 0) {
      newState.records[recordIndex] = { ...newState.records[recordIndex], status: 'archived' };
      newState.history = [...newState.history, addHistoryEvent('ARCHIVE_RECORD', id)];
      saveState(newState);
    }
  };

  const handleSaveEdit = () => {
    if (!editForm.name?.trim() || !editForm.tag?.trim()) {
      setErrorMsg('Name and tag are required');
      return;
    }

    if (editForm.position !== undefined && (editForm.position < 0 || editForm.position > 360)) {
      setErrorMsg('Position must be 0-360');
      return;
    }
    if (editForm.angle !== undefined && (editForm.angle < 0 || editForm.angle > 180)) {
      setErrorMsg('Angle must be 0-180');
      return;
    }

    const newState = { ...session };
    const recordIndex = newState.records.findIndex(r => r.id === selectedRecordId);
    if (recordIndex >= 0) {
      newState.records[recordIndex] = {
        ...newState.records[recordIndex],
        ...editForm,
        status: editForm.status || 'draft'
      } as CameraRecord;
      newState.history = [...newState.history, addHistoryEvent('EDIT_RECORD', selectedRecordId!)];
      saveState(newState);
    }
    setIsEditing(false);
    setErrorMsg('');
  };

  // AUDIT LENS - Signature Interaction
  const handleResolveDiscrepancy = () => {
    if (!selectedRecordId) return;

    const record = session.records.find(r => r.id === selectedRecordId);
    if (!record) return;

    if (record.cells < 5) {
      const newState = { ...session };
      const recordIndex = newState.records.findIndex(r => r.id === selectedRecordId);
      newState.records[recordIndex] = { ...record, auditLensState: 'conflict' };
      newState.history = [...newState.history, addHistoryEvent('AUDIT_CONFLICT', selectedRecordId, 'Insufficient evidence (cells < 5)')];
      saveState(newState);
      setErrorMsg('Conflict: Cannot resolve without sufficient evidence (cells >= 5)');
      return;
    }

    const newState = { ...session };
    const recordIndex = newState.records.findIndex(r => r.id === selectedRecordId);
    newState.records[recordIndex] = {
      ...record,
      auditLensState: 'resolved',
      status: 'ready'
    };
    newState.history = [...newState.history, addHistoryEvent('AUDIT_RESOLVED', selectedRecordId, 'Evidence attached and verified')];
    saveState(newState);
    setErrorMsg('');
  };

  const handleAttachEvidence = () => {
    if (!selectedRecordId) return;
    const newState = { ...session };
    const recordIndex = newState.records.findIndex(r => r.id === selectedRecordId);
    if (recordIndex >= 0) {
      newState.records[recordIndex] = {
        ...newState.records[recordIndex],
        cells: (newState.records[recordIndex].cells || 0) + 5,
        auditLensState: 'changed',
        status: 'changed'
      };
      newState.history = [...newState.history, addHistoryEvent('ATTACH_EVIDENCE', selectedRecordId)];
      saveState(newState);
    }
  };

  // Export/Import
  const handleExport = () => {
    const exportState = {
      ...session,
      exportedAt: new Date().toISOString()
    };
    const json = JSON.stringify(exportState, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'camera-path-v1-audit-lens.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportData = (data: any) => {
    if (data.schemaVersion !== 'v1') {
      setErrorMsg('Invalid schema version. Expected v1');
      return;
    }

    if (!Array.isArray(data.records) || !data.derived || !Array.isArray(data.history)) {
      setErrorMsg('Malformed import: Missing required top-level fields');
      return;
    }

    const validStatuses = ['empty', 'draft', 'ready', 'changed', 'archived'];
    const ids = new Set();

    for (const rec of data.records) {
      if (!rec.id || !rec.name || !rec.tag || !rec.status) {
        setErrorMsg('Malformed import: Missing required record fields');
        return;
      }
      if (!validStatuses.includes(rec.status)) {
        setErrorMsg(`Malformed import: Invalid status ${rec.status}`);
        return;
      }
      if (ids.has(rec.id)) {
        setErrorMsg(`Malformed import: Duplicate ID ${rec.id}`);
        return;
      }
      ids.add(rec.id);
    }

    const newState: StoryboardCameraPathEditorSession = {
      ...data,
      exportedAt: new Date().toISOString(),
    };

    setPastSessions(prev => [...prev, session]);
    setSession(newState);
    setSelectedRecordId(null);
    setErrorMsg('');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        handleImportData(data);
      } catch (err) {
        setErrorMsg('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleWebMCP = (action: string, payload: any) => {
    if (action === 'editor_select' || action === 'entity_select') {
      setSelectedRecordId(payload.id || null);
      if (payload.id) setIsEditing(false);
    } else if (action === 'editor_switch_mode') {
      setAuditLensMode(payload.mode === 'audit');
    } else if (action === 'editor_update_property') {
      if (!selectedRecordId) return;
      const newState = { ...session };
      const recordIndex = newState.records.findIndex(r => r.id === selectedRecordId);
      if (recordIndex >= 0) {
        newState.records[recordIndex] = { ...newState.records[recordIndex], [payload.property]: payload.value };
        newState.history = [...newState.history, addHistoryEvent('UPDATE_PROPERTY', selectedRecordId)];
        saveState(newState);
      }
    } else if (action === 'editor_preview') {
      return { success: true, preview: true };
    } else if (action === 'editor_set_content') {
      // not fully applicable to a simple canvas, but returning success
      return { success: true };
    } else if (action === 'entity_create') {
      handleCreateRecord();
    } else if (action === 'entity_update') {
      if (payload.id) {
         // Perform the update directly to avoid stale closure state
         const newState = { ...session };
         const recordIndex = newState.records.findIndex(r => r.id === payload.id);
         if (recordIndex >= 0) {
           newState.records[recordIndex] = {
             ...newState.records[recordIndex],
             name: payload.name ?? newState.records[recordIndex].name,
             tag: payload.tag ?? newState.records[recordIndex].tag
           };
           newState.history = [...newState.history, addHistoryEvent('EDIT_RECORD', payload.id)];
           saveState(newState);
         }
      }
    } else if (action === 'entity_delete') {
      if (payload.confirm && payload.id) {
        handleDeleteRecord(payload.id);
      }
    } else if (action === 'entity_toggle') {
      if (payload.id && payload.field === 'status') {
         if (payload.value === 'archived') handleArchiveRecord(payload.id);
      }
    } else if (action === 'artifact_export') {
      return { success: true, data: session };
    } else if (action === 'artifact_import') {
      if (payload.sessionData) {
        handleImportData(payload.sessionData);
      }
      return { success: true };
    } else if (action === 'artifact_copy') {
      navigator.clipboard.writeText(JSON.stringify(session, null, 2));
      return { success: true };
    }
  };

  const filteredRecords = filter === 'all'
    ? session.records
    : session.records.filter(r => r.status === filter);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col font-sans">
      <WebMCP session={session} dispatch={handleWebMCP} />
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Camera className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-800">Storyboard Camera Path Editor</h1>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 ml-4">
            <button onClick={() => setAuditLensMode(false)} className={`px-3 py-1 rounded-md text-sm font-medium ${!auditLensMode ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}>Workspace</button>
            <button onClick={() => setAuditLensMode(true)} className={`px-3 py-1 rounded-md text-sm font-medium ${auditLensMode ? 'bg-indigo-600 shadow text-white' : 'text-gray-600'}`}>Audit Lens</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleUndo} disabled={pastSessions.length === 0} className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50" title="Undo (Cmd+Z)">
            <Undo2 className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <button onClick={() => setSession({...INITIAL_STATE, exportedAt: new Date().toISOString(), history: []})} className="p-2 text-gray-600 hover:text-gray-900" title="Clear All">
            <RefreshCcw className="w-5 h-5" />
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium">
            <Download className="w-4 h-4" /> Export
          </button>
          <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium cursor-pointer">
            <Upload className="w-4 h-4" /> Import
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
          </label>
        </div>
      </header>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Pane - List */}
        <div className="w-full lg:w-1/3 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden shrink-0">
          <div className="p-4 border-b border-gray-200 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-700">Story Beats</h2>
              <button onClick={handleCreateRecord} className="p-1 hover:bg-gray-100 rounded text-indigo-600"><Plus className="w-5 h-5" /></button>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
            >
              <option value="all">All Statuses</option>
              <option value="empty">Empty</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredRecords.length === 0 ? (
              <div className="text-center p-8 text-gray-500">No records found.</div>
            ) : (
              filteredRecords.map(record => (
                <div
                  key={record.id}
                  onClick={() => {
                    setSelectedRecordId(record.id);
                    setIsEditing(false);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedRecordId === record.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-gray-200 hover:border-indigo-100'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-900">{record.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      record.status === 'ready' ? 'bg-green-100 text-green-800' :
                      record.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                      record.status === 'empty' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex gap-2">
                    <span className="bg-gray-100 px-1.5 rounded">{record.tag}</span>
                    <span>Evidence: {record.cells} cells</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center/Right Pane */}
        <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden relative">
          {selectedRecordId ? (
            <div className="h-full flex flex-col lg:flex-row">
              {/* Main Content Area */}
              <div className="flex-1 p-6 overflow-y-auto">
                {auditLensMode ? (
                  // AUDIT LENS VIEW
                  <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b">
                      <div className="p-3 bg-indigo-100 rounded-lg text-indigo-700">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Audit Lens</h2>
                        <p className="text-sm text-gray-500">Resolve discrepancies and verify evidence</p>
                      </div>
                    </div>

                    {(() => {
                      const record = session.records.find(r => r.id === selectedRecordId);
                      if (!record) return null;
                      return (
                        <div className="space-y-8">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Selected Record</div>
                              <div className="text-lg font-medium">{record.name}</div>
                              <div className="text-sm text-gray-600">{record.id}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Audit Status</div>
                              <div className={`text-lg font-medium capitalize flex items-center gap-2 ${
                                record.auditLensState === 'resolved' ? 'text-green-600' :
                                record.auditLensState === 'conflict' ? 'text-red-600' :
                                record.auditLensState === 'changed' ? 'text-blue-600' :
                                'text-gray-600'
                              }`}>
                                {record.auditLensState === 'conflict' && <AlertCircle className="w-5 h-5" />}
                                {record.auditLensState === 'resolved' && <CheckCircle2 className="w-5 h-5" />}
                                {record.auditLensState || 'idle'}
                              </div>
                            </div>
                          </div>

                          <div className="border border-gray-200 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-4">Evidence Verification</h3>
                            <div className="flex items-center justify-between mb-6">
                              <div>
                                <div className="text-sm text-gray-500 mb-1">Current Cells</div>
                                <div className="text-3xl font-bold font-mono">{record.cells}</div>
                              </div>
                              <button
                                onClick={handleAttachEvidence}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 shadow-sm flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" /> Attach Evidence
                              </button>
                            </div>

                            <button
                              onClick={handleResolveDiscrepancy}
                              className={`w-full py-3 rounded-xl font-bold text-white shadow-sm transition-all ${
                                record.auditLensState === 'resolved' ? 'bg-green-500 hover:bg-green-600' :
                                'bg-indigo-600 hover:bg-indigo-700'
                              }`}
                            >
                              Resolve Discrepancy
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  // WORKSPACE VIEW
                  <div className="max-w-3xl mx-auto space-y-6">
                    {(() => {
                      const record = session.records.find(r => r.id === selectedRecordId);
                      if (!record) return null;

                      if (isEditing) {
                        return (
                          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-medium mb-4">Edit Properties</h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                  type="text"
                                  value={editForm.name || ''}
                                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                                  className="w-full bg-white border border-gray-300 rounded-md p-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
                                <input
                                  type="text"
                                  value={editForm.tag || ''}
                                  onChange={e => setEditForm({...editForm, tag: e.target.value})}
                                  className="w-full bg-white border border-gray-300 rounded-md p-2"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Position (0-360)</label>
                                  <input
                                    type="number"
                                    value={editForm.position ?? ''}
                                    onChange={e => setEditForm({...editForm, position: e.target.value ? Number(e.target.value) : undefined})}
                                    className="w-full bg-white border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Angle (0-180)</label>
                                  <input
                                    type="number"
                                    value={editForm.angle ?? ''}
                                    onChange={e => setEditForm({...editForm, angle: e.target.value ? Number(e.target.value) : undefined})}
                                    className="w-full bg-white border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-3 pt-4">
                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                                <button onClick={handleSaveEdit} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save</button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h2 className="text-2xl font-bold text-gray-900">{record.name}</h2>
                              <div className="text-gray-500 mt-1">{record.id} • {record.tag}</div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditForm(record); setIsEditing(true); }} className="p-2 text-gray-500 hover:text-indigo-600 rounded bg-gray-50"><Edit2 className="w-5 h-5" /></button>
                              <button onClick={() => handleArchiveRecord(record.id)} className="p-2 text-gray-500 hover:text-yellow-600 rounded bg-gray-50"><Archive className="w-5 h-5" /></button>
                              <button onClick={() => handleDeleteRecord(record.id)} className="p-2 text-gray-500 hover:text-red-600 rounded bg-gray-50"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="text-xs text-gray-500 mb-1">Status</div>
                              <div className="font-medium capitalize">{record.status}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="text-xs text-gray-500 mb-1">Evidence</div>
                              <div className="font-medium font-mono">{record.cells} cells</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="text-xs text-gray-500 mb-1">Position</div>
                              <div className="font-medium">{record.position ?? '--'}°</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="text-xs text-gray-500 mb-1">Angle</div>
                              <div className="font-medium">{record.angle ?? '--'}°</div>
                            </div>
                          </div>

                          <div className="h-64 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
                            {/* Visual representation of camera path */}
                            {record.position !== undefined && record.angle !== undefined ? (
                              <div
                                className="w-16 h-16 bg-indigo-500/20 border-2 border-indigo-500 rounded flex items-center justify-center transition-all duration-500"
                                style={{
                                  transform: `rotate(${record.angle}deg) translateX(${record.position - 180}px)`
                                }}
                              >
                                <Camera className="w-8 h-8 text-indigo-700" />
                              </div>
                            ) : (
                              <div className="text-gray-400">Canvas Preview</div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Detail Panel / Derived View */}
              <div className="w-full lg:w-72 bg-white border-l border-gray-200 p-6 flex flex-col shrink-0 overflow-y-auto">
                <h3 className="font-semibold text-gray-900 mb-4 uppercase text-xs tracking-wider">Derived Summary</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Total Beats</span>
                    <span className="font-mono font-medium">{session.derived.summary.totalRecords}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Ready</span>
                    <span className="font-mono font-medium text-green-600">{session.derived.summary.readyRecords}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Archived</span>
                    <span className="font-mono font-medium text-gray-500">{session.derived.summary.archivedRecords}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Conflicts</span>
                    <span className="font-mono font-medium text-red-500">{session.derived.summary.conflicts}</span>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-4 uppercase text-xs tracking-wider">Event History</h3>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {session.history.slice().reverse().map(evt => (
                    <div key={evt.id} className="text-sm">
                      <div className="text-xs text-gray-400 mb-0.5">{new Date(evt.timestamp).toLocaleTimeString()}</div>
                      <div className="font-medium text-gray-800">{evt.action}</div>
                      {evt.recordId && <div className="text-gray-500 text-xs font-mono mt-0.5">{evt.recordId}</div>}
                    </div>
                  ))}
                  {session.history.length === 0 && <div className="text-gray-400 text-sm">No events yet</div>}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 flex-col">
              <Camera className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a story beat to view or edit</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
