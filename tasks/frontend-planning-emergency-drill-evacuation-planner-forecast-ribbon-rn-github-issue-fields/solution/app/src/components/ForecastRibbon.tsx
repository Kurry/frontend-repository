import { useState, useEffect } from 'react';
import { useAppStore, store } from '../store';
import { Undo2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

export function ForecastRibbon() {
  const { checkpoints, selectedId } = useAppStore();
  const cp = checkpoints.find(c => c.id === selectedId);

  // Local state for the ribbon form
  const [draft, setDraft] = useState({ predicted: 0, headcount: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cp) {
      setDraft({ predicted: cp.predicted_time, headcount: cp.headcount });
      setError(null);
    }
  }, [cp]);

  if (!cp) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white text-gray-400 p-8 text-center h-full">
        Select a drill checkpoint to view and adjust forecast projections.
      </div>
    );
  }

  const isConflict = draft.predicted > cp.target_time;
  const isChanged = draft.predicted !== cp.predicted_time || draft.headcount !== cp.headcount;

  const handleApply = () => {
    if (draft.predicted < 0 || draft.headcount < 0) {
      setError("Values must be non-negative");
      return;
    }

    // Only accept exact boundary/valid mutations
    if (draft.predicted > cp.target_time * 2) {
      setError("Prediction wildly exceeds bounds. Rejected.");
      return;
    }

    store.updateCheckpoint(cp.id, {
      predicted_time: draft.predicted,
      headcount: draft.headcount,
      status: isConflict ? 'changed' : 'ready'
    });
    setError(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{cp.name}</h2>
          <p className="text-sm text-gray-500 mt-1">ID: {cp.id} • Target Clearance: {cp.target_time}m</p>
        </div>
        <button
          onClick={() => store.undo()}
          className="flex items-center gap-1 text-sm bg-white border border-gray-300 px-3 py-1.5 rounded shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Undo2 size={16} /> Undo
        </button>
      </div>

      <div className="p-8 flex-1 flex flex-col max-w-3xl mx-auto w-full">
        <h3 className="text-lg font-semibold mb-6">Forecast Ribbon</h3>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8 shadow-inner">
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Adjust Predicted Time (min)</label>
              <input
                type="number"
                value={draft.predicted}
                onChange={e => setDraft({ ...draft, predicted: parseInt(e.target.value) || 0 })}
                className="border border-gray-300 p-2 rounded w-full text-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Adjust Headcount</label>
              <input
                type="number"
                value={draft.headcount}
                onChange={e => setDraft({ ...draft, headcount: parseInt(e.target.value) || 0 })}
                className="border border-gray-300 p-2 rounded w-full text-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 text-red-600 bg-red-50 p-3 rounded text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              {error} - Correct the value to apply.
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleApply}
              disabled={!isChanged}
              className={clsx(
                "px-6 py-2 rounded font-medium transition-colors cursor-pointer",
                isChanged
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              )}
            >
              Apply Forecast
            </button>
          </div>
        </div>

        {/* Projected Outcomes */}
        <h3 className="text-lg font-semibold mb-4">Projected Outcomes</h3>
        <div className={clsx(
          "p-6 rounded-lg border transition-colors",
          isConflict ? "bg-red-50 border-red-200 text-red-900" : "bg-green-50 border-green-200 text-green-900"
        )}>
          <div className="flex items-center gap-3 mb-2">
            {isConflict ? <AlertTriangle size={24} className="text-red-500" /> : <CheckCircle2 size={24} className="text-green-500" />}
            <span className="text-xl font-bold">
              {isConflict ? "Target Exceeded" : "Within Bounds"}
            </span>
          </div>
          <p className="opacity-80">
            {isConflict
              ? `Predicted clearance of ${draft.predicted}m exceeds target ${cp.target_time}m by ${draft.predicted - cp.target_time}m.`
              : `Predicted clearance of ${draft.predicted}m is comfortably under the ${cp.target_time}m target.`}
          </p>
          <div className="mt-4 pt-4 border-t border-black/10 flex gap-8">
            <div>
              <span className="block text-xs uppercase opacity-70 font-semibold tracking-wider">Flow Rate</span>
              <span className="text-lg">
                {draft.predicted > 0 ? (draft.headcount / draft.predicted).toFixed(1) : 0} pax/min
              </span>
            </div>
            <div>
              <span className="block text-xs uppercase opacity-70 font-semibold tracking-wider">Status Delta</span>
              <span className="text-lg capitalize font-medium">
                {cp.status} → {isConflict ? 'changed' : 'ready'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
