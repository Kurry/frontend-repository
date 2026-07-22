import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Calendar, RefreshCw } from 'lucide-react';

export const Planner = () => {
  const { state, dispatch } = useAppContext();
  const [rescheduleData, setRescheduleData] = useState({});

  const handleReschedule = (id) => {
    const data = rescheduleData[id];
    if (!data?.date) return;
    dispatch({
      type: 'RESCHEDULE_OCCURRENCE',
      payload: { id, newDate: data.date, scope: data.scope || 'this' }
    });
    setRescheduleData({ ...rescheduleData, [id]: null });
  };

  const createOrder = (occurrence) => {
    const series = state.series.find(s => s.id === occurrence.seriesId);
    dispatch({
      type: 'CREATE_WORK_ORDER',
      payload: {
        occurrenceId: occurrence.id,
        assetId: series.assetId,
        task: series.type,
        partsRequired: series.partsRequired
      }
    });
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Calendar size={20} className="text-green-600" /> Maintenance Planner
      </h2>

      <div className="space-y-3">
        {state.occurrences.map(occ => {
          const series = state.series.find(s => s.id === occ.seriesId);
          const assetName = state.assets.find(a => a.id === series?.assetId)?.name;
          const isOverdue = occ.status === 'overdue' || new Date(occ.date) < new Date();

          return (
            <div key={occ.id} className="p-3 border rounded shadow-sm bg-white flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-500 font-semibold">{assetName}</div>
                  <div className="font-medium text-gray-800 flex items-center gap-2">
                    <RefreshCw size={14} className="text-gray-400"/> {series?.type}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                  ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
                `}>
                  {occ.date}
                </div>
              </div>

              <div className="flex gap-2 items-center bg-gray-50 p-2 rounded mt-1 border">
                <input
                  type="date"
                  className="border p-1 text-xs rounded"
                  value={rescheduleData[occ.id]?.date || ''}
                  onChange={e => setRescheduleData({ ...rescheduleData, [occ.id]: { ...rescheduleData[occ.id], date: e.target.value }})}
                />
                <select
                  className="border p-1 text-xs rounded"
                  value={rescheduleData[occ.id]?.scope || 'this'}
                  onChange={e => setRescheduleData({ ...rescheduleData, [occ.id]: { ...rescheduleData[occ.id], scope: e.target.value }})}
                >
                  <option value="this">This only</option>
                  <option value="this-and-future">This & Future</option>
                </select>
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-xs px-2 py-1 rounded transition-colors"
                  onClick={() => handleReschedule(occ.id)}
                >
                  Reschedule
                </button>
                <div className="flex-1"></div>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded font-medium shadow-sm"
                  onClick={() => createOrder(occ)}
                  disabled={state.workOrders.some(w => w.occurrenceId === occ.id)}
                >
                  Start Work
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
