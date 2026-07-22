import React, { useState, useRef } from 'react';
import { useWasteTrackerState } from './state';
import { WebMCP } from './WebMCP';
import type { WasteRecord, LaneId } from './types';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Download, Upload, Undo2, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';

const LANES: { id: LaneId; title: string; color: string; maxWeight?: number }[] = [
  { id: 'unassigned', title: 'Unassigned', color: 'bg-neutral-200' },
  { id: 'compost', title: 'Compost', color: 'bg-green-100', maxWeight: 10 },
  { id: 'recycle', title: 'Recycle', color: 'bg-blue-100' },
  { id: 'trash', title: 'Trash', color: 'bg-neutral-300' },
];

export default function App() {
  const {
    records,
    derivedSummary,
    addRecord,
    updateRecord,
    archiveRecord,
    moveRecord,
    resolveConflict,
    undo,
    exportData,
    importData,
    canUndo
  } = useWasteTrackerState();

  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editWeight, setEditWeight] = useState('');

  const activeRecords = records.filter(r => r.status !== 'archived');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(newWeight);
    if (!newName.trim() || isNaN(weight) || weight <= 0) {
      setError("Please enter a valid name and positive weight.");
      return;
    }
    addRecord({ name: newName.trim(), weight });
    setNewName('');
    setNewWeight('');
    setError(null);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    setError(null);
    moveRecord(draggableId, destination.droppableId as LaneId);
  };

  const startEdit = (record: WasteRecord) => {
    setEditingRecord(record.id);
    setEditName(record.name);
    setEditWeight(record.weight.toString());
  };

  const saveEdit = () => {
    if (!editingRecord) return;
    const weight = parseFloat(editWeight);
    if (!editName.trim() || isNaN(weight) || weight <= 0) {
      setError("Please enter a valid name and positive weight for edit.");
      return;
    }
    updateRecord(editingRecord, { name: editName.trim(), weight });
    setEditingRecord(null);
    setError(null);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waste-diversion-v1-constraint-canvas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = importData(json);
        if (!success) setError("Failed to import: Invalid schema.");
        else setError(null);
      } catch (err) {
        setError("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
      <WebMCP
        records={records}
        addRecord={addRecord}
        updateRecord={updateRecord}
        archiveRecord={archiveRecord}
        moveRecord={moveRecord}
        exportData={exportData}
        importData={importData}
      />

      {/* Left Sidebar: Controls & Summary */}
      <div className="w-full md:w-1/3 lg:w-1/4 space-y-6 shrink-0">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
          <h1 className="text-xl font-semibold mb-4 text-neutral-800">Waste Tracker</h1>

          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-600">Item Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="mt-1 w-full p-2 border rounded-md"
                placeholder="e.g. Banana Peel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                className="mt-1 w-full p-2 border rounded-md"
                placeholder="e.g. 1.5"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2">
              <Plus size={16} /> Add Item
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
          <h2 className="text-lg font-semibold mb-3 text-neutral-800">Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Total Weight:</span>
              <span className="font-medium">{derivedSummary.totalWeight.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Diversion Rate:</span>
              <span className="font-medium text-green-600">{derivedSummary.diversionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
          <h2 className="text-lg font-semibold mb-3 text-neutral-800">Actions</h2>
          <div className="space-y-2 text-sm">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="w-full flex items-center justify-center gap-2 p-2 border rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Undo2 size={16} /> Undo Last Action
            </button>
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 p-2 border rounded-md hover:bg-neutral-50"
            >
              <Download size={16} /> Export Session
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-2 border rounded-md hover:bg-neutral-50"
            >
              <Upload size={16} /> Import Session
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </div>
      </div>

      {/* Right Area: Constraint Canvas */}
      <div className="flex-1 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-neutral-200 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-6 text-neutral-800">Constraint Canvas</h2>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-col md:flex-row gap-4 min-w-max md:min-w-0 h-full min-h-[500px]">
            {LANES.map(lane => (
              <div key={lane.id} className={`flex-1 min-w-[250px] rounded-lg border border-neutral-200 flex flex-col bg-neutral-50`}>
                <div className={`p-3 border-b border-neutral-200 ${lane.color} rounded-t-lg font-medium text-neutral-800 flex justify-between items-center`}>
                  <span>{lane.title}</span>
                  {lane.maxWeight && <span className="text-xs text-neutral-600 bg-white/50 px-2 py-1 rounded">Max {lane.maxWeight}kg</span>}
                </div>
                <Droppable droppableId={lane.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 p-3 space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}`}
                    >
                      {activeRecords.filter(r => r.lane === lane.id).map((record, index) => (
                        <Draggable key={record.id} draggableId={record.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white p-3 rounded-md shadow-sm border ${
                                record.status === 'conflict' ? 'border-red-500 bg-red-50' :
                                record.status === 'changed' ? 'border-orange-300 bg-orange-50' :
                                record.status === 'resolved' ? 'border-green-400 bg-green-50' : 'border-neutral-200'
                              } ${snapshot.isDragging ? 'shadow-md scale-105' : ''} transition-transform flex flex-col gap-2 group`}
                              style={provided.draggableProps.style}
                            >
                              {editingRecord === record.id ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full text-sm p-1 border rounded"
                                  />
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editWeight}
                                    onChange={e => setEditWeight(e.target.value)}
                                    className="w-full text-sm p-1 border rounded"
                                  />
                                  <div className="flex gap-2">
                                    <button onClick={saveEdit} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Save</button>
                                    <button onClick={() => setEditingRecord(null)} className="text-xs bg-neutral-100 px-2 py-1 rounded">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between items-start">
                                    <span className="font-medium text-neutral-800 break-words">{record.name}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => startEdit(record)} className="p-1 text-neutral-400 hover:text-blue-600 rounded">
                                        <Edit2 size={14} />
                                      </button>
                                      <button onClick={() => archiveRecord(record.id)} className="p-1 text-neutral-400 hover:text-red-600 rounded">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-600">{record.weight} kg</span>
                                    <div className="flex items-center gap-1">
                                      {record.status === 'conflict' && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] uppercase font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">Conflict</span>
                                          <button onClick={() => resolveConflict(record.id)} className="text-[10px] uppercase font-bold text-green-700 bg-green-200 px-1.5 py-0.5 rounded hover:bg-green-300">Resolve</button>
                                        </div>
                                      )}
                                      {record.status === 'changed' && (
                                        <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">Modified</span>
                                      )}
                                      {record.status === 'resolved' && (
                                        <span className="text-[10px] uppercase font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">Resolved</span>
                                      )}
                                    </div>
                                  </div>
                                  {record.status === 'conflict' && (
                                    <div className="text-xs text-red-600 mt-1">Weight exceeds {lane.maxWeight}kg limit. Reduce weight or move to another lane to resolve.</div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
