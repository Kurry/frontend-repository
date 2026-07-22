import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Download, Upload, Trash2, Undo2, Square, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Types
type RecordStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'conflict' | 'resolved' | 'archived';

interface StoryBeat {
  id: string;
  title: string;
  duration: number;
  description: string;
  status: RecordStatus;
  lane: number;
  order: number;
}

interface DerivedState {
  summary: {
    total: number;
    byStatus: Record<RecordStatus, number>;
  };
}

interface SessionData {
  schemaVersion: 'v1';
  exportedAt: string;
  records: StoryBeat[];
  derived: DerivedState;
  history: any[];
}

const INITIAL_RECORDS: StoryBeat[] = [
  { id: '1', title: 'Opening Scene', duration: 15, description: 'Wide shot of the city', status: 'draft', lane: 0, order: 0 },
  { id: '2', title: 'Character Intro', duration: 30, description: 'Close up on protagonist', status: 'empty', lane: 1, order: 1 },
  { id: '3', title: 'Action Sequence', duration: 45, description: 'Fast cuts during chase', status: 'ready', lane: 2, order: 2 },
  { id: '4', title: 'Conflict Resolution', duration: 60, description: 'Slow pan over aftermath', status: 'changed', lane: 0, order: 3 },
  { id: '5', title: 'Ending Credits', duration: 120, description: 'Scrolling text', status: 'archived', lane: 1, order: 4 },
];

for(let i=6; i<=100; i++) {
    INITIAL_RECORDS.push({
        id: i.toString(),
        title: `Beat ${i}`,
        duration: 10,
        description: '...',
        status: 'draft',
        lane: i % 3,
        order: i - 1
    })
}


const STATUS_COLORS: Record<RecordStatus, string> = {
  empty: 'bg-gray-100 text-gray-500 border-gray-200',
  draft: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  ready: 'bg-green-50 text-green-700 border-green-200',
  changed: 'bg-blue-50 text-blue-700 border-blue-200',
  conflict: 'bg-red-50 text-red-700 border-red-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  archived: 'bg-gray-50 text-gray-400 border-gray-100',
};

const LANE_CONSTRAINTS = [500, 300, 200]; // Max duration per lane

const App: React.FC = () => {
  const [records, setRecords] = useState<StoryBeat[]>(INITIAL_RECORDS);
  const [history, setHistory] = useState<StoryBeat[][]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [draggedRecordId, setDraggedRecordId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState<'canvas' | 'list'>('canvas');

  // Expose to WebMCP
  useEffect(() => {
    (window as any).webmcp_session_info = () => ({
      modules: ['structured-editor-v1', 'entity-collection-v1', 'artifact-transfer-v1']
    });

    (window as any).webmcp_list_tools = () => [
      { name: 'editor_select', description: 'Select a record', parameters: { id: 'string' } },
      { name: 'editor_update_property', description: 'Update record property', parameters: { id: 'string', property: 'string', value: 'any' } },
      { name: 'editor_set_content', description: 'Set canvas content', parameters: { content: 'any' } },
      { name: 'entity_create', description: 'Create a record', parameters: { record: 'any' } },
      { name: 'entity_select', description: 'Select an entity', parameters: { id: 'string' } },
      { name: 'entity_update', description: 'Update an entity', parameters: { id: 'string', updates: 'any' } },
      { name: 'entity_delete', description: 'Delete an entity', parameters: { id: 'string', confirm: 'boolean' } },
      { name: 'artifact_export', description: 'Export artifact', parameters: { format: 'string' } },
      { name: 'artifact_import', description: 'Import artifact', parameters: { format: 'string', data: 'any' } },
      { name: 'artifact_copy', description: 'Copy artifact', parameters: { format: 'string' } },
    ];

    (window as any).webmcp_invoke_tool = (name: string, args: any) => {
      let res = null;
      if (name === 'editor_select' || name === 'entity_select') {
        setSelectedRecordId(args.id);
        res = { success: true };
      } else if (name === 'editor_update_property' || name === 'entity_update') {
        handleUpdateRecord(args.id, { [args.property || Object.keys(args.updates)[0]]: args.value || Object.values(args.updates)[0] });
        res = { success: true };
      } else if (name === 'entity_create') {
        handleAddRecord();
        res = { success: true, id: Math.random().toString(36).substring(7) };
      } else if (name === 'entity_delete') {
         if(args.confirm) {
             handleDeleteRecord(args.id);
             res = { success: true };
         } else {
             res = { error: 'Confirmation required' };
         }
      } else if (name === 'artifact_export') {
        res = { data: generateArtifact() };
      } else if (name === 'artifact_import') {
         handleImport(args.data);
         res = { success: true };
      }

      return Promise.resolve(res);
    };
  }, [records, history]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setRecords(prev);
    }
  }, [history]);

  useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              handleUndo();
          }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo]);

  const saveHistory = (newRecords: StoryBeat[]) => {
    setHistory([...history, records]);
    setRecords(newRecords);
  };

  const checkConflict = (lane: number, id: string, newDuration: number, currentRecords: StoryBeat[]) => {
      const laneRecords = currentRecords.filter(r => r.lane === lane && r.id !== id);
      const laneTotal = laneRecords.reduce((sum, r) => sum + r.duration, 0) + newDuration;
      return laneTotal > LANE_CONSTRAINTS[lane];
  };

  const handleUpdateRecord = (id: string, updates: Partial<StoryBeat>) => {
    const record = records.find(r => r.id === id);
    if(!record) return;

    let newStatus = updates.status || (Object.keys(updates).length > 0 ? 'changed' as RecordStatus : record.status);

    // Bounds check for duration if it is being updated
    if (updates.duration !== undefined) {
        if (updates.duration < 1 || updates.duration > 300) {
            // Out of bounds, reject and preserve valid state
            setErrors(prev => ({...prev, duration: 'Duration must be between 1 and 300 seconds.'}));
            return;
        } else {
             setErrors(prev => ({...prev, duration: undefined}));
        }
    }

    if (updates.title !== undefined && updates.title.trim() === '') {
        setErrors(prev => ({...prev, title: 'Title is required.'}));
        return;
    } else {
        setErrors(prev => ({...prev, title: undefined}));
    }

    const futureDuration = updates.duration !== undefined ? updates.duration : record.duration;
    const futureLane = updates.lane !== undefined ? updates.lane : record.lane;

    const hasConflict = checkConflict(futureLane, id, futureDuration, records);
    if (hasConflict) {
        newStatus = 'conflict';
    } else if (record.status === 'conflict') {
        newStatus = 'resolved';
    }

    const newRecords = records.map((r) => (r.id === id ? { ...r, ...updates, status: newStatus } : r));
    saveHistory(newRecords);
  };

  const [errors, setErrors] = useState<{duration?: string, title?: string}>({});

  const handleMoveLane = (id: string, newLane: number) => {
       if (newLane < 0 || newLane > 2) return;
       handleUpdateRecord(id, { lane: newLane });
  };

  const handleAddRecord = () => {
    const newRecord: StoryBeat = {
      id: Math.random().toString(36).substring(7),
      title: 'New Beat',
      duration: 10,
      description: '',
      status: 'empty',
      lane: 0,
      order: records.length,
    };
    saveHistory([...records, newRecord]);
    setSelectedRecordId(newRecord.id);
  };

  const handleDeleteRecord = (id: string) => {
    saveHistory(records.filter((r) => r.id !== id));
    if (selectedRecordId === id) setSelectedRecordId(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedRecordId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, laneIndex: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
        const record = records.find(r => r.id === id);
        if(record && record.lane !== laneIndex) {
            handleUpdateRecord(id, { lane: laneIndex });
        }
    }
    setDraggedRecordId(null);
  };

  const getDerivedState = (): DerivedState => {
    const defaultByStatus: Record<RecordStatus, number> = {
      empty: 0,
      draft: 0,
      ready: 0,
      changed: 0,
      conflict: 0,
      resolved: 0,
      archived: 0
    };

    const byStatus = records.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, defaultByStatus);

    return {
      summary: {
        total: records.length,
        byStatus
      },
    };
  };

  const generateArtifact = (): SessionData => {
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived: getDerivedState(),
      history: history.map(h => h.map(r => r.id)),
    };
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(generateArtifact(), null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "camera-path-v1-constraint-canvas.json");
    dlAnchorElem.click();
  };

  const handleImport = (dataStr: string) => {
      try {
          const data = JSON.parse(dataStr);
          if (data.schemaVersion === 'v1' && Array.isArray(data.records)) {
              // Basic validation
              const valid = data.records.every((r: any) =>
                  r.id && typeof r.title === 'string' && typeof r.duration === 'number' &&
                  ['empty', 'draft', 'ready', 'changed', 'conflict', 'resolved', 'archived'].includes(r.status)
              );
              if (valid) {
                 setRecords(data.records);
                 setHistory([]);
                 setSelectedRecordId(null);
                 setErrors({});
              } else {
                  alert("Invalid import format: Record validation failed. Prior state preserved.");
              }
          } else {
               alert("Invalid import format: Schema version mismatch. Prior state preserved.");
          }
      } catch (e) {
          alert("Invalid import format: JSON parsing failed. Prior state preserved.");
      }
  };

  const handleClear = () => {
        saveHistory([]);
        setRecords([]);
        setSelectedRecordId(null);
        setErrors({});
  }

  const derived = getDerivedState();
  const selectedRecord = records.find((r) => r.id === selectedRecordId);

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-semibold">Storyboard Camera Path Editor</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleUndo} disabled={history.length === 0} className="p-2 text-gray-500 hover:text-gray-900 disabled:opacity-50" title="Undo (Ctrl+Z)">
            <Undo2 className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <button onClick={handleClear} className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-md hover:bg-red-50">Clear</button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
            <Download className="w-4 h-4" /> Export
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 cursor-pointer">
            <Upload className="w-4 h-4" /> Import
             <input type="file" accept=".json" className="hidden" onChange={(e) => {
                 const file = e.target.files?.[0];
                 if(file) {
                     const reader = new FileReader();
                     reader.onload = (event) => {
                         if(event.target?.result) handleImport(event.target.result as string);
                     };
                     reader.readAsText(file);
                 }
             }}/>
          </label>
        </div>
      </header>

      {/* Main Content */}
      <div className={`flex-1 flex ${isMobile ? 'flex-col overflow-y-auto' : 'flex-row overflow-hidden'}`}>

        {/* Mobile Tabs */}
        {isMobile && (
            <div className="flex border-b border-gray-200 bg-white">
                <button
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'canvas' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('canvas')}
                >
                    Constraint Canvas
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'list' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('list')}
                >
                    Details & Summary
                </button>
            </div>
        )}

        {/* Primary Work Surface: Constraint Canvas */}
        <div className={`flex-1 bg-gray-100/50 p-6 overflow-x-auto overflow-y-auto ${isMobile && activeTab !== 'canvas' ? 'hidden' : 'block'}`}>
          <div className="min-w-[800px] flex gap-6 h-full pb-8">
            {[0, 1, 2].map((laneIndex) => {
                const laneRecords = records.filter((r) => r.lane === laneIndex);
                const laneDuration = laneRecords.reduce((sum, r) => sum + r.duration, 0);
                const maxDuration = LANE_CONSTRAINTS[laneIndex];
                const isOverConstraint = laneDuration > maxDuration;

                return (
              <div
                key={laneIndex}
                className={`flex-1 bg-gray-200/50 rounded-xl border-2 border-dashed p-4 flex flex-col gap-4 min-h-[500px] ${isOverConstraint ? 'border-red-400 bg-red-50/50' : 'border-gray-300'}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, laneIndex)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                      <h3 className="font-semibold text-gray-700">Constraint Lane {laneIndex + 1}</h3>
                      <p className={`text-xs ${isOverConstraint ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                          {laneDuration}s / {maxDuration}s
                      </p>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {laneRecords.length}
                  </span>
                </div>

                {laneRecords
                  .sort((a, b) => a.order - b.order)
                  .map((record) => (
                    <motion.div
                      layout
                      key={record.id}
                      draggable
                      onDragStart={(e: any) => handleDragStart(e, record.id)}
                      onClick={() => setSelectedRecordId(record.id)}
                      onKeyDown={(e) => {
                         if(e.key === 'Enter' || e.key === ' ') {
                             e.preventDefault();
                             setSelectedRecordId(record.id);
                         } else if (e.key === 'ArrowRight') {
                             e.preventDefault();
                             handleMoveLane(record.id, record.lane + 1);
                         } else if (e.key === 'ArrowLeft') {
                             e.preventDefault();
                             handleMoveLane(record.id, record.lane - 1);
                         }
                      }}
                      tabIndex={0}
                      className={`
                        p-4 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-indigo-500 relative
                        ${selectedRecordId === record.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'}
                        ${STATUS_COLORS[record.status]}
                        ${draggedRecordId === record.id ? 'opacity-50' : 'opacity-100'}
                        bg-white
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium truncate pr-2">{record.title}</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${STATUS_COLORS[record.status]}`}>
                          {record.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mb-3 truncate">{record.description || 'No description'}</div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{record.duration}s</span>
                        {record.status === 'conflict' && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        {record.status === 'resolved' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>

                      {/* Alternate input controls for moving lanes */}
                      {selectedRecordId === record.id && (
                          <div className="absolute top-1/2 -right-3 -translate-y-1/2 flex flex-col gap-1 z-10">
                              {laneIndex > 0 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMoveLane(record.id, laneIndex - 1); }}
                                    className="p-1 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50"
                                    title="Move Left"
                                >
                                    <span className="text-xs font-bold leading-none">&lt;</span>
                                </button>
                              )}
                              {laneIndex < 2 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMoveLane(record.id, laneIndex + 1); }}
                                    className="p-1 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50"
                                    title="Move Right"
                                >
                                    <span className="text-xs font-bold leading-none">&gt;</span>
                                </button>
                              )}
                          </div>
                      )}
                    </motion.div>
                  ))}
              </div>
            )})}
          </div>
        </div>

        {/* Sidebar: Summary & Detail Panel */}
        <div className={`w-full md:w-80 bg-white border-l border-gray-200 flex flex-col flex-none ${isMobile && activeTab !== 'list' ? 'hidden' : 'block'}`}>
          {/* Summary */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Session Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{derived.summary.total}</div>
                <div className="text-xs text-gray-500 uppercase">Total Beats</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="text-2xl font-bold text-indigo-600">{derived.summary.byStatus.changed}</div>
                <div className="text-xs text-gray-500 uppercase">Changed</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <div className="text-2xl font-bold text-red-600">{derived.summary.byStatus.conflict}</div>
                <div className="text-xs text-red-500 uppercase">Conflicts</div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <div className="text-2xl font-bold text-emerald-600">{derived.summary.byStatus.resolved}</div>
                <div className="text-xs text-emerald-500 uppercase">Resolved</div>
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Record Details</h2>
                <button onClick={handleAddRecord} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">+ Add New</button>
            </div>

            {selectedRecord ? (
              <div className="space-y-4">
                {selectedRecord.status === 'conflict' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <h4 className="text-sm font-bold text-red-700 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Conflict Detected</h4>
                        <p className="text-xs text-red-600 mt-1">
                            This beat exceeds the constraint lane limit. Reduce duration or move it to another lane to resolve.
                        </p>
                    </div>
                )}
                {selectedRecord.status === 'resolved' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                        <h4 className="text-sm font-bold text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Conflict Resolved</h4>
                    </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={selectedRecord.title}
                    onChange={(e) => handleUpdateRecord(selectedRecord.id, { title: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Duration (s) <span className="text-gray-400 font-normal">1-300</span></label>
                  <input
                    type="number"
                    value={selectedRecord.duration}
                    onChange={(e) => handleUpdateRecord(selectedRecord.id, { duration: parseInt(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors.duration ? 'border-red-500' : 'border-gray-300'}`}
                    min="1"
                    max="300"
                  />
                  {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedRecord.status}
                    onChange={(e) => handleUpdateRecord(selectedRecord.id, { status: e.target.value as RecordStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {Object.keys(STATUS_COLORS).map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={selectedRecord.description}
                    onChange={(e) => handleUpdateRecord(selectedRecord.id, { description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200 mt-6 flex gap-2">
                    <button
                        onClick={() => handleDeleteRecord(selectedRecord.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                    {selectedRecord.status === 'conflict' && (
                        <button
                            onClick={() => handleUpdateRecord(selectedRecord.id, { duration: Math.min(selectedRecord.duration, 10) })}
                            className="flex-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 focus:outline-none"
                        >
                            Auto Resolve
                        </button>
                    )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
                <Square className="w-8 h-8 mb-3 opacity-50" />
                <p className="text-sm">Select a record on the canvas to view or edit details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
