import React, { useState, useReducer, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { z } from 'zod';
import {
  CloudRain,
  Wind,
  Thermometer,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Undo2
} from 'lucide-react';

// --- Domain Models & Schema ---
export type Status = 'draft' | 'ready' | 'changed' | 'archived';

export interface AirReading {
  id: string;
  status: Status;
  value: number; // Air quality index or particulate reading
  date: string;
  forecastRibbonState?: number; // Mutated projection value
}

export interface DerivedState {
  summary: {
    average: number;
    count: number;
    projectedAverage: number;
  };
}

export interface HistoryEvent {
  action: string;
  timestamp: string;
  recordId?: string;
  details?: string;
  snapshot: AirReading[]; // For undo
}

export interface SessionState {
  schemaVersion: 'v1';
  exportedAt?: string;
  records: AirReading[];
  derived: DerivedState;
  history: HistoryEvent[];
}

const AirReadingSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['draft', 'ready', 'changed', 'archived']),
  value: z.number().min(0).max(500),
  date: z.string().min(1),
  forecastRibbonState: z.number().min(0).max(500).optional(),
});

const SessionStateSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string().optional(),
  records: z.array(AirReadingSchema),
  derived: z.object({
    summary: z.object({
      average: z.number(),
      count: z.number(),
      projectedAverage: z.number()
    })
  }),
  history: z.array(z.any()) // Basic type checking for history
});

// --- Action Types ---
type Action =
  | { type: 'CREATE_RECORD'; payload: AirReading }
  | { type: 'UPDATE_RECORD'; payload: AirReading }
  | { type: 'ARCHIVE_RECORD'; payload: string }
  | { type: 'SET_FORECAST'; payload: { id: string; projection: number } }
  | { type: 'UNDO' }
  | { type: 'IMPORT_STATE'; payload: SessionState }
  | { type: 'EXPORT_STATE' };

// --- Helpers ---
const generateId = () => Math.random().toString(36).substring(2, 9);
const calculateDerived = (records: AirReading[]): DerivedState => {
  const activeRecords = records.filter(r => r.status !== 'archived');
  const count = activeRecords.length;
  const avg = count ? activeRecords.reduce((sum, r) => sum + r.value, 0) / count : 0;
  const projAvg = count ? activeRecords.reduce((sum, r) => sum + (r.forecastRibbonState !== undefined ? r.forecastRibbonState : r.value), 0) / count : 0;
  return {
    summary: {
      average: Math.round(avg * 10) / 10,
      count,
      projectedAverage: Math.round(projAvg * 10) / 10
    }
  };
};

const initialState: SessionState = {
  schemaVersion: 'v1',
  records: [],
  derived: { summary: { average: 0, count: 0, projectedAverage: 0 } },
  history: []
};

// --- Reducer ---
function reducer(state: SessionState, action: Action): SessionState {
  let newRecords: AirReading[];
  switch (action.type) {
    case 'CREATE_RECORD':
      newRecords = [...state.records, action.payload];
      return {
        ...state,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: [...state.history, {
          action: 'create',
          timestamp: new Date().toISOString(),
          recordId: action.payload.id,
          snapshot: state.records
        }]
      };
    case 'UPDATE_RECORD':
      newRecords = state.records.map(r => r.id === action.payload.id ? action.payload : r);
      return {
        ...state,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: [...state.history, {
          action: 'update',
          timestamp: new Date().toISOString(),
          recordId: action.payload.id,
          snapshot: state.records
        }]
      };
    case 'ARCHIVE_RECORD':
      newRecords = state.records.map(r => r.id === action.payload ? { ...r, status: 'archived' } : r);
      return {
        ...state,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: [...state.history, {
          action: 'archive',
          timestamp: new Date().toISOString(),
          recordId: action.payload,
          snapshot: state.records
        }]
      };
    case 'SET_FORECAST':
      newRecords = state.records.map(r => r.id === action.payload.id ? {
        ...r,
        forecastRibbonState: action.payload.projection,
        status: 'changed'
      } : r);
      return {
        ...state,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: [...state.history, {
          action: 'forecast',
          timestamp: new Date().toISOString(),
          recordId: action.payload.id,
          snapshot: state.records
        }]
      };
    case 'UNDO':
      if (state.history.length === 0) return state;
      const lastState = state.history[state.history.length - 1];
      return {
        ...state,
        records: lastState.snapshot,
        derived: calculateDerived(lastState.snapshot),
        history: state.history.slice(0, -1)
      };
    case 'IMPORT_STATE':
      return {
        ...action.payload,
        derived: calculateDerived(action.payload.records)
      };
    case 'EXPORT_STATE':
      return {
        ...state,
        exportedAt: new Date().toISOString()
      };
    default:
      return state;
  }
}

// --- Global Expose for WebMCP ---
declare global {
  interface Window {
    __appState: SessionState;
    __appDispatch: React.Dispatch<Action>;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    window.__appState = state;
    window.__appDispatch = dispatch;
  }, [state]);

  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AirReading>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [importError, setImportError] = useState<string | null>(null);

  const [selectedForForecast, setSelectedForForecast] = useState<string | null>(null);
  const [projectionValue, setProjectionValue] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        dispatch({ type: 'UNDO' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const validateField = (field: keyof AirReading, value: any) => {
    let newErrors = { ...errors };
    if (field === 'value') {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 500) {
        newErrors.value = 'Value must be between 0 and 500. Adjust to correct bounds.';
      } else {
        delete newErrors.value;
      }
    }
    if (field === 'date') {
      if (!value) {
        newErrors.date = 'Date is required. Please provide a valid date.';
      } else {
        delete newErrors.date;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    const isValValid = validateField('value', formData.value);
    const isDateValid = validateField('date', formData.date);
    if (!isValValid || !isDateValid) return;

    if (editingId && editingId !== 'new') {
      dispatch({ type: 'UPDATE_RECORD', payload: formData as AirReading });
    } else {
      dispatch({ type: 'CREATE_RECORD', payload: { ...formData, id: generateId(), status: formData.status || 'draft' } as AirReading });
    }
    setEditingId(null);
    setFormData({});
  };

  const handleExport = () => {
    dispatch({ type: 'EXPORT_STATE' });
    setTimeout(() => {
      const stateToExport = window.__appState;
      const blob = new Blob([JSON.stringify(stateToExport, null, 2)], { type: 'application/json' });
      saveAs(blob, 'air-quality-v1-forecast-ribbon.json');
    }, 0);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawData = JSON.parse(event.target?.result as string);

        // Transactional Zod Validation
        const parsed = SessionStateSchema.safeParse(rawData);
        if (!parsed.success) {
            const diag = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
            throw new Error(`Schema validation failed: ${diag}`);
        }

        const data = parsed.data;

        // Check for duplicate IDs
        const uniqueIds = new Set<string>();
        for (const record of data.records) {
            if (uniqueIds.has(record.id)) {
                throw new Error(`Duplicate ID: ${record.id}`);
            }
            uniqueIds.add(record.id);
        }

        // Cross-field derived value validation
        const calculatedDerived = calculateDerived(data.records as AirReading[]);
        if (Math.abs(calculatedDerived.summary.average - data.derived.summary.average) > 0.1 ||
            Math.abs(calculatedDerived.summary.count - data.derived.summary.count) > 0 ||
            Math.abs(calculatedDerived.summary.projectedAverage - data.derived.summary.projectedAverage) > 0.1) {
             throw new Error("Stale derived values");
        }

        // Atomic commit - no state is mutated if an error is thrown above this line
        dispatch({ type: 'IMPORT_STATE', payload: data as SessionState });
      } catch (err: any) {
        console.error('Import failed:', err);
        setImportError(err.message);
        // Invalid import applies NO mutations to state.
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleForecastApply = () => {
    if (selectedForForecast) {
      dispatch({ type: 'SET_FORECAST', payload: { id: selectedForForecast, projection: projectionValue } });
      setSelectedForForecast(null);
    }
  };

  const filteredRecords = state.records.filter(r => filter === 'all' ? true : r.status === filter);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">

      {/* Sidebar / Tools */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-4 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 mb-1">
            <Wind className="text-blue-500" />
            Air Quality
          </h1>
          <p className="text-sm text-slate-500">Trendbook Forecast</p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => { setEditingId('new'); setFormData({ status: 'draft', value: 0, date: new Date().toISOString().split('T')[0] }); }}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> New Reading
          </button>

          <button onClick={() => dispatch({ type: 'UNDO' })} disabled={state.history.length === 0} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 disabled:opacity-50 p-2">
            <Undo2 size={16} /> Undo <span className="text-xs ml-auto text-slate-400">Cmd+Z</span>
          </button>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Filters</h3>
          {(['all', 'draft', 'ready', 'changed', 'archived'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-left px-3 py-1.5 rounded text-sm capitalize ${filter === s ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 pt-4">
           <button onClick={handleExport} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 p-2">
             <Download size={16} /> Export JSON
           </button>
           <label className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 p-2 cursor-pointer">
             <Upload size={16} /> Import JSON
             <input type="file" accept=".json" onChange={handleImport} className="hidden" />
           </label>
           {importError && (
             <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-200">
               {importError}
             </div>
           )}
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 p-6 flex flex-col gap-6 overflow-auto">

        {/* Derived Summary Linked View */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Active Records</div>
            <div className="text-2xl font-semibold">{state.derived.summary.count}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Current Average</div>
            <div className="text-2xl font-semibold">{state.derived.summary.average}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200 bg-blue-50">
            <div className="text-sm text-blue-600 mb-1 font-medium">Projected Average</div>
            <div className="text-2xl font-semibold text-blue-700">{state.derived.summary.projectedAverage}</div>
          </div>
        </div>

        {/* Forecast Ribbon Linked View */}
        {selectedForForecast && (
          <div className="bg-white p-4 rounded-lg shadow-md border-2 border-blue-400 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Thermometer className="text-blue-500" />
              Adjust Projection (Forecast Ribbon)
            </h3>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <input
                type="range"
                min="0" max="500"
                value={projectionValue}
                onChange={e => setProjectionValue(Number(e.target.value))}
                className="flex-1 w-full"
                aria-label="Adjust projection value"
              />
              <div className="text-xl font-mono w-16 text-center">{projectionValue}</div>
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={() => setSelectedForForecast(null)} className="flex-1 px-4 py-2 border rounded text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleForecastApply} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Apply</button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Adjusting this record changes its status to 'changed' and updates the projected average.</p>
          </div>
        )}

        {/* Edit Modal / Inline form */}
        {editingId && (
          <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
            <h3 className="font-semibold mb-4">{editingId === 'new' ? 'New Record' : 'Edit Record'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">Value (0-500)</label>
                <input
                  type="number"
                  value={formData.value ?? ''}
                  onChange={e => {
                    setFormData({...formData, value: Number(e.target.value)});
                    validateField('value', e.target.value);
                  }}
                  className={`w-full border rounded px-3 py-2 ${errors.value ? 'border-red-500' : 'border-slate-300'}`}
                />
                {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value}</p>}
              </div>
              <div>
                <label className="block text-sm mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date ?? ''}
                  onChange={e => {
                    setFormData({...formData, date: e.target.value});
                    validateField('date', e.target.value);
                  }}
                  className={`w-full border rounded px-3 py-2 ${errors.date ? 'border-red-500' : 'border-slate-300'}`}
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-sm mb-1">Status</label>
                <select
                  value={formData.status || 'draft'}
                  onChange={e => setFormData({...formData, status: e.target.value as Status})}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="changed">Changed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setEditingId(null)} className="px-4 py-2 border rounded hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800">Save</button>
            </div>
          </div>
        )}

        {/* Records List */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-semibold text-sm text-slate-600 grid grid-cols-4 md:grid-cols-6 gap-4">
             <div className="col-span-2">Date & ID</div>
             <div>Value</div>
             <div>Status</div>
             <div className="hidden md:block">Projection</div>
             <div className="text-right">Actions</div>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                 <CloudRain size={32} className="mb-2 opacity-50" />
                 <p>No records found for this view.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {filteredRecords.map(record => (
                  <li key={record.id} className="group flex items-center px-2 py-3 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100 transition-all">
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-4 w-full items-center">
                      <div className="col-span-2 flex flex-col">
                        <span className="font-medium">{record.date}</span>
                        <span className="text-xs text-slate-400 font-mono">{record.id}</span>
                      </div>
                      <div className="font-mono text-lg">{record.value}</div>
                      <div>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize
                          ${record.status === 'ready' ? 'bg-green-100 text-green-700' :
                            record.status === 'changed' ? 'bg-orange-100 text-orange-700' :
                            record.status === 'archived' ? 'bg-slate-100 text-slate-600' :
                            'bg-blue-100 text-blue-700'}`}
                        >
                          {record.status}
                        </span>
                      </div>
                      <div className="hidden md:block">
                        {record.forecastRibbonState !== undefined ? (
                           <span className="text-blue-600 font-mono font-medium">{record.forecastRibbonState}</span>
                        ) : (
                           <span className="text-slate-300">-</span>
                        )}
                      </div>
                      <div className="text-right flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                        <button
                          onClick={() => { setSelectedForForecast(record.id); setProjectionValue(record.forecastRibbonState ?? record.value); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Forecast Ribbon"
                          aria-label="Adjust forecast ribbon"
                        >
                          <Thermometer size={16} />
                        </button>
                        <button
                          onClick={() => { setEditingId(record.id); setFormData(record); }}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        {record.status !== 'archived' && (
                          <button
                            onClick={() => dispatch({ type: 'ARCHIVE_RECORD', payload: record.id })}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                            title="Archive"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
