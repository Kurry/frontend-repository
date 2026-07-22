import React, { useState } from "react";
import { useStore } from "../store";
import { EventStatus, ScenarioState, WasteEvent } from "../types";

export function WasteEventCollection() {
  const store = useStore();
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [status, setStatus] = useState<EventStatus>("draft");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<EventStatus | "all">("all");

  // Edit state
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = Number(weight);
    if (isNaN(weightNum) || weightNum < 0 || weightNum > 10000) {
      setError("Weight must be between 0 and 10000 lbs. Adjust value to fix.");
      return;
    }
    if (!name.trim()) {
      setError("Name is required. Adjust value to fix.");
      return;
    }
    setError("");
    store.addRecord({
      name,
      weightLb: weightNum,
      status,
      scenarioState: "idle",
      date: new Date().toISOString().split("T")[0]
    });
    setName("");
    setWeight("");
    setStatus("draft");
  };

  const startEdit = (r: WasteEvent) => {
      setEditingId(r.id);
      setEditName(r.name);
  }

  const saveEdit = (id: string) => {
      if(editName.trim()){
         store.updateRecord(id, { name: editName });
      }
      setEditingId("");
  }

  const filtered = store.state.records.filter(r => filter === "all" || r.status === filter);

  return (
    <div className="flex flex-col gap-4 p-4 border rounded bg-white shadow">
      <h2 className="text-xl font-bold">Waste Events</h2>

      <form onSubmit={handleCreate} className="flex flex-col gap-2 p-2 border bg-gray-50 rounded">
        <h3 className="font-semibold">Create Event</h3>
        {error && <div className="text-red-500 text-sm" role="alert">{error}</div>}
        <input
          aria-label="Event Name"
          placeholder="Event Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-1"
        />
        <input
          aria-label="Weight (lbs)"
          type="number"
          placeholder="Weight (lbs)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="border p-1"
        />
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as EventStatus)}
          className="border p-1"
        >
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">Create</button>
      </form>

      <div className="flex gap-2 items-center">
        <span className="text-sm font-semibold">Filter:</span>
        <select aria-label="Filter status" value={filter} onChange={(e) => setFilter(e.target.value as any)} className="border p-1">
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && <p className="text-gray-500 text-sm">No events found.</p>}
        {filtered.map(r => (
          <div key={r.id} className="border p-2 flex justify-between items-center rounded transition-all duration-300 transform-gpu motion-reduce:transition-none" data-testid={`record-${r.id}`}>
            <div>
              {editingId === r.id ? (
                 <div className="flex gap-2 mb-1">
                     <input value={editName} onChange={e => setEditName(e.target.value)} className="border p-1 text-sm"/>
                     <button onClick={() => saveEdit(r.id)} className="bg-green-500 text-white px-2 py-1 text-xs rounded">Save</button>
                     <button onClick={() => setEditingId("")} className="bg-gray-300 px-2 py-1 text-xs rounded">Cancel</button>
                 </div>
              ) : (
                 <div className="font-semibold flex items-center gap-2">
                     {r.name}
                     <button onClick={() => startEdit(r)} className="text-xs text-blue-500 underline" aria-label={`Edit name of ${r.name}`}>Edit Name</button>
                 </div>
              )}
              <div className="text-sm text-gray-600">{r.weightLb} lbs - Status: {r.status} - Scenario: {r.scenarioState}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <select
                 className="text-xs border p-1 rounded"
                 value={r.status}
                 onChange={e => store.updateRecord(r.id, { status: e.target.value as EventStatus })}
                 aria-label={`Update status of ${r.name}`}
              >
                 <option value="draft">Draft</option>
                 <option value="ready">Ready</option>
                 <option value="changed">Changed</option>
                 <option value="archived">Archived</option>
              </select>
              <div className="flex gap-2">
                 <button onClick={() => store.updateRecord(r.id, { status: "archived" })} className="text-sm text-gray-500 underline">Archive</button>
                 <button onClick={() => {
                    if (window.confirm("Delete record?")) store.deleteRecord(r.id);
                 }} className="text-sm text-red-500 underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
