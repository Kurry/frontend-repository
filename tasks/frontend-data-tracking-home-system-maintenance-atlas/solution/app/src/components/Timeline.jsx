import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Activity, AlertTriangle } from 'lucide-react';

export const Timeline = () => {
  const { state, dispatch } = useAppContext();
  const [form, setForm] = useState({ assetId: state.assets[0]?.id || '', measure: '', value: '', unit: '' });

  const handleBrush = (time) => {
    dispatch({ type: 'SET_ACTIVE_TIME', payload: time });
  };

  const submitReading = (e) => {
    e.preventDefault();
    if (!form.measure || !form.value) return;
    dispatch({
      type: 'ADD_READING',
      payload: { ...form, value: Number(form.value), observedTime: new Date().toISOString(), provenance: 'User', note: 'Manual entry' }
    });
    setForm({ ...form, measure: '', value: '' });
  };

  const sortedEvents = [...state.readings, ...state.symptoms].sort((a, b) => {
    const tA = new Date(a.observedTime || '1970-01-01').getTime();
    const tB = new Date(b.observedTime || '1970-01-01').getTime();
    return tB - tA; // descending
  });

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Activity size={20} className="text-blue-600" /> Condition & Symptom Timeline
      </h2>

      <form onSubmit={submitReading} className="flex gap-2 mb-4 text-sm items-end bg-white p-3 border rounded shadow-sm">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 font-medium">Asset</label>
          <select className="border rounded p-1" value={form.assetId} onChange={e => setForm({...form, assetId: e.target.value})}>
            {state.assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 font-medium">Measure</label>
          <input className="border rounded p-1 w-32" placeholder="e.g. Temp" value={form.measure} onChange={e => setForm({...form, measure: e.target.value})} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 font-medium">Value</label>
          <input className="border rounded p-1 w-20" type="number" step="any" value={form.value} onChange={e => setForm({...form, value: e.target.value})} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 font-medium">Unit</label>
          <input className="border rounded p-1 w-16" placeholder="F" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 h-[30px] font-medium">Log</button>
      </form>

      <div className="max-h-64 overflow-y-auto pr-2 relative"
           onMouseLeave={() => dispatch({ type: 'SET_ACTIVE_TIME', payload: null })}>
        <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-300"></div>
        {sortedEvents.map(ev => {
          const isSymptom = !!ev.severity;
          const asset = state.assets.find(a => a.id === ev.assetId);
          const time = ev.observedTime || ev.id;
          const isActive = state.activeTime === time;

          return (
            <div
              key={ev.id}
              className={`flex gap-3 mb-3 relative pl-8 cursor-pointer p-2 rounded transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
              onMouseEnter={() => handleBrush(time)}
            >
              <div className={`absolute left-[9px] top-4 w-2.5 h-2.5 rounded-full border-2 border-white ${isSymptom ? 'bg-red-500' : 'bg-blue-500'}`}></div>

              <div className="flex-1 bg-white p-2 rounded border shadow-sm text-sm">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{new Date(ev.observedTime || Date.now()).toLocaleString()}</span>
                  <span>{asset?.name}</span>
                </div>
                {isSymptom ? (
                  <div className="flex items-center gap-2 text-red-700 font-medium">
                    <AlertTriangle size={14} /> {ev.type} ({ev.severity}) - {ev.interval}
                  </div>
                ) : (
                  <div>
                    <span className="font-medium text-gray-800">{ev.measure}:</span>
                    <span className="mx-1 font-mono">{ev.value} {ev.unit}</span>
                    <span className="text-xs text-gray-500 ml-2">[{ev.note}]</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
