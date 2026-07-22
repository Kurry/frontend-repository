import React from 'react';
import { useStore, RecipeIngredientSchema } from './store';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Undo2, Download, Upload, Trash2, Plus, Archive } from 'lucide-react';
import { z } from 'zod';

const STATUS_COLORS = {
  empty: 'bg-gray-100 text-gray-800 border-gray-200',
  draft: 'bg-blue-100 text-blue-800 border-blue-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  changed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  archived: 'bg-slate-200 text-slate-800 border-slate-300',
  conflict: 'bg-red-100 text-red-800 border-red-200',
  resolved: 'bg-teal-100 text-teal-800 border-teal-200'
};

const HandoffMap = () => {
  const { records, selectedRecordId, assignHandoffOwner } = useStore();
  const selectedRecord = records.find(r => r.id === selectedRecordId);

  const owners = ['Baker', 'Prep', 'Line', 'Pastry Chef'];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Handoff Map</h2>
      {selectedRecord ? (
        <div className="flex-1 flex flex-col">
          <div className="mb-4">
            <span className="text-sm text-gray-500">Selected Item</span>
            <div className="text-xl font-medium">{selectedRecord.name}</div>
            <div className="text-sm text-gray-500">{selectedRecord.quantity} {selectedRecord.unit}</div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            {owners.map(owner => (
              <button
                key={owner}
                onClick={() => assignHandoffOwner(selectedRecordId, owner)}
                className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center font-medium ${
                  selectedRecord.handoffOwner === owner
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700'
                }`}
              >
                {owner}
              </button>
            ))}
            <button
               onClick={() => assignHandoffOwner(selectedRecordId, null)}
               className={`col-span-2 p-3 rounded-xl border-2 border-dashed transition-all flex items-center justify-center font-medium ${
                 !selectedRecord.handoffOwner
                   ? 'border-red-400 bg-red-50 text-red-600'
                   : 'border-gray-300 hover:border-gray-400 text-gray-500'
               }`}
            >
              Clear Owner
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 italic">
          Select an ingredient to assign handoff
        </div>
      )}
    </div>
  );
};

const RecordEditor = () => {
  const { records, selectedRecordId, updateRecord, deleteRecord, archiveRecord } = useStore();
  const selectedRecord = records.find(r => r.id === selectedRecordId);

  const [formData, setFormData] = React.useState(selectedRecord || {});
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    if (selectedRecord) {
      setFormData(selectedRecord);
      setErrors({});
    }
  }, [selectedRecord]);

  if (!selectedRecord) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'quantity') {
      newValue = value === '' ? '' : Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSave = () => {
    try {
      // Validate
      RecipeIngredientSchema.parse(formData);
      setErrors({});
      updateRecord(selectedRecord.id, formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach(err => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Edit Ingredient</h2>
        <div className="flex gap-2">
          <button
            onClick={() => archiveRecord(selectedRecord.id)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
            title="Archive"
          >
            <Archive size={16} />
          </button>
          <button
            onClick={() => deleteRecord(selectedRecord.id)}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md outline-none ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity === '' ? '' : formData.quantity}
              onChange={handleChange}
              min="0"
              className={`w-full p-2 border rounded-md outline-none ${errors.quantity ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`}
            />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
          </div>
          <div className="w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <input
              type="text"
              name="unit"
              value={formData.unit || ''}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md outline-none ${errors.unit ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={formData.status || 'draft'}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md outline-none focus:border-blue-500"
          >
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="conflict">Conflict</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-md transition-colors mt-2"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

const RecordItem = ({ record, isSelected, onSelect }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.button
      layoutId={`record-${record.id}`}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
      whileHover={{ scale: shouldReduceMotion ? 1 : 1.01 }}
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-lg border cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-gray-900">{record.name}</div>
          <div className="text-sm text-gray-500">{record.quantity} {record.unit}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[record.status] || STATUS_COLORS.empty}`}>
            {record.status}
          </span>
          {record.handoffOwner && (
            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
              {record.handoffOwner}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

const Summary = () => {
  const { getDerivedState } = useStore();
  const summary = getDerivedState().summary;

  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-3 rounded shadow-sm border border-slate-100 text-center">
          <div className="text-2xl font-bold text-slate-800">{summary.total}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="bg-white p-3 rounded shadow-sm border border-slate-100 text-center">
          <div className="text-2xl font-bold text-green-600">{summary.ready}</div>
          <div className="text-xs text-slate-500">Ready</div>
        </div>
        <div className="bg-white p-3 rounded shadow-sm border border-slate-100 text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.draft}</div>
          <div className="text-xs text-slate-500">Draft</div>
        </div>
        <div className="bg-white p-3 rounded shadow-sm border border-slate-100 text-center">
          <div className="text-2xl font-bold text-slate-400">{summary.archived}</div>
          <div className="text-xs text-slate-500">Archived</div>
        </div>
      </div>
    </div>
  )
}

const App = () => {
  const { records, selectedRecordId, selectRecord, undo, history, getArtifactData, importData, clearData, addRecord } = useStore();
  const [filter, setFilter] = React.useState('all');

  const filteredRecords = React.useMemo(() => {
    if (filter === 'all') return records;
    return records.filter(r => r.status === filter);
  }, [records, filter]);

  const handleExport = () => {
    const data = getArtifactData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recipe-substitution-v1-handoff-map.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const success = importData(data);
        if(!success) alert("Invalid import data");
      } catch (err) {
        alert("Invalid JSON");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Recipe Substitution Sandbox</h1>
            <p className="text-slate-500 text-sm">Manage recipe ingredients & handoffs</p>
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
             <button
                onClick={undo}
                disabled={history.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-50 transition-colors"
             >
                <Undo2 size={16} /> <span className="hidden sm:inline">Undo</span>
             </button>
             <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
             >
                <Download size={16} /> <span className="hidden sm:inline">Export</span>
             </button>
             <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors">
                <Upload size={16} /> <span className="hidden sm:inline">Import</span>
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
             </label>
             <button
                onClick={clearData}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
             >
                <Trash2 size={16} /> <span className="hidden sm:inline">Clear</span>
             </button>
          </div>
        </header>

        <Summary />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Collection Panel */}
          <div className="lg:col-span-2 space-y-4">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center overflow-x-auto gap-4">
               <div className="flex gap-2 shrink-0">
                 {['all', 'empty', 'draft', 'ready', 'changed', 'archived', 'conflict', 'resolved'].map(f => (
                   <button
                     key={f}
                     onClick={() => setFilter(f)}
                     className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                       filter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                     }`}
                   >
                     {f}
                   </button>
                 ))}
               </div>
               <button
                  onClick={() => {
                    addRecord({ name: 'New Ingredient', quantity: 0, unit: 'g', status: 'draft' });
                  }}
                  className="flex items-center shrink-0 gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
               >
                 <Plus size={16} /> Add
               </button>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filteredRecords.map(record => (
                    <RecordItem
                      key={record.id}
                      record={record}
                      isSelected={selectedRecordId === record.id}
                      onSelect={() => selectRecord(record.id)}
                    />
                  ))}
                </AnimatePresence>
                {filteredRecords.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                    No ingredients found for this filter.
                  </div>
                )}
             </div>
          </div>

          {/* Side Panel (Handoff Map & Editor) */}
          <div className="space-y-6">
            <HandoffMap />
            <RecordEditor />
          </div>

        </div>

      </div>
    </div>
  );
};

export default App;
