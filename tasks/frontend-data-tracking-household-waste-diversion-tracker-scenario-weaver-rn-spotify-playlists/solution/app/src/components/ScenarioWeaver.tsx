import React, { useState } from "react";
import { useStore } from "../store";

export function ScenarioWeaver() {
  const store = useStore();
  const [selectedId, setSelectedId] = useState("");
  const [scenarioWeight, setScenarioWeight] = useState("");
  const [error, setError] = useState("");

  const handleBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) {
      setError("Please select a record to branch.");
      return;
    }
    const weightNum = Number(scenarioWeight);
    if (isNaN(weightNum) || weightNum < 0 || weightNum > 10000) {
      setError("Scenario weight must be between 0 and 10000 lbs. Adjust value to fix.");
      return;
    }
    setError("");
    store.branchScenario(selectedId, weightNum);
    setSelectedId("");
    setScenarioWeight("");
  };

  const selectedRecord = store.state.records.find(r => r.id === selectedId);

  return (
    <div className="flex flex-col gap-4 p-4 border rounded bg-indigo-50 shadow">
      <h2 className="text-xl font-bold text-indigo-900">Scenario Weaver</h2>
      <p className="text-sm text-indigo-800">Branch a selected record into a scenario and compare linked outcomes.</p>

      <form onSubmit={handleBranch} className="flex flex-col gap-2 p-2 bg-white border rounded">
        {error && <div className="text-red-500 text-sm" role="alert">{error}</div>}

        <label className="text-sm font-semibold">Select Event to Branch:</label>
        <select
          aria-label="Select record to branch"
          value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setError(""); }}
          className="border p-1"
        >
          <option value="">-- Select an Event --</option>
          {store.state.records.map(r => (
            <option key={r.id} value={r.id}>{r.name} (Current: {r.weightLb} lbs)</option>
          ))}
        </select>

        {selectedRecord && (
          <div className="text-sm text-gray-600 my-1">
            Currently {selectedRecord.weightLb} lbs. Enter new scenario weight below.
          </div>
        )}

        <input
          aria-label="Scenario Weight"
          type="number"
          placeholder="New Scenario Weight (lbs)"
          value={scenarioWeight}
          onChange={(e) => setScenarioWeight(e.target.value)}
          className="border p-1"
        />

        <button type="submit" className="bg-indigo-600 text-white p-2 rounded font-semibold hover:bg-indigo-700">
          Branch Scenario
        </button>
      </form>
    </div>
  );
}
