import React, { useState, useEffect } from "react";
import { getState, subscribe, undo, importState, clearSession } from "../store";

export function LinkedSummary() {
  const [summary, setSummary] = useState(getState().derived.summary);
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    setSummary(getState().derived.summary);
    const unsubscribe = subscribe(() => {
      setSummary(getState().derived.summary);
      setHasHistory(true);
    });
    return () => unsubscribe();
  }, []);

  const handleExport = () => {
    const state = getState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "classroom-rotations-v1-constraint-canvas.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      importState(content);
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  return (
    <div className="w-full bg-white p-4 flex flex-col gap-6 shrink-0 h-full overflow-y-auto">
      <div>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Derived Summary</h2>
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="text-2xl font-bold text-blue-700">{summary.totalStations}</div>
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Active Stations</div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Capacity by Lane</h3>
            {Object.entries(summary.laneCapacities).length > 0 ? (
              Object.entries(summary.laneCapacities).map(([lane, cap]) => (
                <div key={lane} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">{lane}</span>
                  <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full text-xs">{cap}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-400 italic">No assigned capacities</div>
            )}
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      <div className="space-y-3 pb-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Actions</h2>

        <button
          onClick={undo}
          disabled={!hasHistory}
          className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Undo Last Mutation (Cmd+Z)
        </button>

        <button
          onClick={handleExport}
          className="w-full py-2 px-3 bg-primary hover:bg-blue-600 text-white font-medium text-sm rounded transition-colors"
        >
          Export Session JSON
        </button>

        <div>
          <input
            type="file"
            id="import-file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <label
            htmlFor="import-file"
            className="w-full py-2 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm rounded transition-colors cursor-pointer text-center block"
          >
            Import JSON
          </label>
        </div>

        <button
          onClick={clearSession}
          className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm rounded transition-colors"
        >
          Clear Session
        </button>
      </div>
    </div>
  );
}
