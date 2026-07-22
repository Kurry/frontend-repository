import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import type { RecordStatus, ApplianceRecord } from './store';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Undo, Download, Upload, GitBranch, Edit2, Plus, Folder } from 'lucide-react';
import { setupWebMCP } from './webmcp';

setupWebMCP();

function App() {
  const { records, derived, branchScenario, undo, exportData, importData, updateRecord, addRecord } = useAppStore();
  const [filter, setFilter] = useState<RecordStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<ApplianceRecord>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appliance-service-v1-scenario-weaver.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (json.schemaVersion === 'v1') {
            importData(json);
          }
        } catch (err) {
          console.error("Invalid import format", err);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'Name is required';
    if (!formData.model?.trim()) newErrors.model = 'Model is required';
    if (!formData.status) newErrors.status = 'Status is required';
    if (formData.cost === undefined || formData.cost < 0) newErrors.cost = 'Cost must be >= 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    if (isEditing) {
      updateRecord(isEditing, formData);
      setIsEditing(null);
    } else if (isCreating) {
      addRecord({
        id: `rec-${Date.now()}`,
        name: formData.name!,
        model: formData.model!,
        status: formData.status as RecordStatus,
        cost: formData.cost,
      });
      setIsCreating(false);
    }
    setFormData({});
  };

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Primary surface */}
      <div className="flex-1 flex flex-col">
        <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Appliance Records</h1>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setIsCreating(true); setIsEditing(null); setFormData({ status: 'draft', cost: 0 }); }} className="p-2 border rounded hover:bg-gray-100 flex items-center gap-1 cursor-pointer">
              <Plus size={16} /> New
            </button>
            <button onClick={undo} className="p-2 border rounded hover:bg-gray-100 flex items-center gap-1 cursor-pointer" title="Undo (Ctrl+Z)">
              <Undo size={16} /> Undo
            </button>
            <button onClick={handleExport} className="p-2 border rounded hover:bg-gray-100 flex items-center gap-1 cursor-pointer">
              <Download size={16} /> Export
            </button>
            <label className="p-2 border rounded hover:bg-gray-100 flex items-center gap-1 cursor-pointer">
              <Upload size={16} /> Import
              <input type="file" className="hidden" accept=".json" onChange={handleImport} />
            </label>
          </div>
        </header>

        <div className="mb-4 flex gap-2 flex-wrap">
          {(['all', 'empty', 'draft', 'ready', 'changed', 'archived'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded cursor-pointer ${filter === status ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {status}
            </button>
          ))}
        </div>

        {(isCreating || isEditing) && (
          <div className="mb-4 p-4 border rounded bg-white shadow-sm flex flex-col gap-2">
            <h2 className="font-bold">{isEditing ? 'Edit Record' : 'New Record'}</h2>
            <input placeholder="Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="border p-2 rounded" />
            {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}

            <input placeholder="Model" value={formData.model || ''} onChange={e => setFormData({...formData, model: e.target.value})} className="border p-2 rounded" />
            {errors.model && <span className="text-red-500 text-sm">{errors.model}</span>}

            <select value={formData.status || ''} onChange={e => setFormData({...formData, status: e.target.value as RecordStatus})} className="border p-2 rounded">
              <option value="">Select Status</option>
              <option value="empty">empty</option>
              <option value="draft">draft</option>
              <option value="ready">ready</option>
              <option value="changed">changed</option>
              <option value="archived">archived</option>
            </select>
            {errors.status && <span className="text-red-500 text-sm">{errors.status}</span>}

            <input type="number" placeholder="Cost" value={formData.cost ?? ''} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} className="border p-2 rounded" />
            {errors.cost && <span className="text-red-500 text-sm">{errors.cost}</span>}

            <div className="flex gap-2">
              <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer">Save</button>
              <button onClick={() => { setIsCreating(false); setIsEditing(null); }} className="px-4 py-2 rounded border cursor-pointer">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto border rounded bg-white p-4 grid gap-4 h-[600px] content-start relative">
          <AnimatePresence>
            {filteredRecords.map(record => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                key={record.id}
                className={`p-4 border rounded flex justify-between items-center transition-colors ${record.status === 'changed' ? 'border-blue-500 bg-blue-50' : ''} ${selectedIds.has(record.id) ? 'ring-2 ring-blue-300' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <input type="checkbox" checked={selectedIds.has(record.id)} onChange={() => toggleSelect(record.id)} className="cursor-pointer" />
                  <div>
                    <h3 className="font-semibold">{record.name}</h3>
                    <p className="text-sm text-gray-600">Model: {record.model} | Status: {record.status} | Cost: ${record.cost}</p>
                    {record.scenarioState && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">Scenario: {record.scenarioState}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsEditing(record.id); setIsCreating(false); setFormData(record); setErrors({}); }}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => branchScenario(record.id, (record.cost || 0) + 50)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded cursor-pointer"
                    title="Branch Scenario"
                  >
                    <GitBranch size={16} />
                  </button>
                  <button
                    onClick={() => updateRecord(record.id, { status: 'archived' })}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded cursor-pointer"
                    title="Archive"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Linked view */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <div className="border p-4 rounded bg-white shadow-sm transition-all duration-300">
          <h2 className="text-lg font-bold mb-2">Derived Summary</h2>
          <p className="text-sm whitespace-pre-wrap">{derived.summary}</p>
        </div>

        <div className="border p-4 rounded bg-white shadow-sm">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2"><Folder size={18} /> Collection State</h2>
          <p className="text-sm text-gray-600 mb-2">Selected items: {selectedIds.size}</p>
          {selectedIds.size > 0 && (
            <div className="flex gap-2">
              <button onClick={() => {
                selectedIds.forEach(id => updateRecord(id, { status: 'archived' }));
                setSelectedIds(new Set());
              }} className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded cursor-pointer">Archive Selected</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
