import { useState, useEffect } from "react";
import { Station, StationStatus } from "../types";
import { getState, subscribe, addStation, updateStation, deleteStation } from "../store";
import { Plus, Edit2, Trash2 } from "lucide-react";

export function StationsCollection() {
  const [records, setRecords] = useState<Station[]>([]);
  const [filter, setFilter] = useState<StationStatus | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Station>>({});

  useEffect(() => {
    setRecords(getState().records);
    const unsubscribe = subscribe(() => setRecords(getState().records));
    return () => unsubscribe();
  }, []);

  const filteredRecords = records.filter(
    (r) => r.status !== "archived" && (filter === "all" || r.status === filter)
  );

  const handleEdit = (station: Station) => {
    setEditingId(station.id);
    setEditForm(station);
  };

  const handleSave = () => {
    if (editingId && editForm) {
      updateStation(editingId, editForm);
    }
    setEditingId(null);
  };

  const handleAddNew = () => {
    addStation({
      name: "New Station",
      lane: null,
      teacher: "Teacher Name",
      capacity: 10,
    });
  };

  return (
    <div className="w-full bg-white flex flex-col h-full shrink-0 relative">
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h2 className="text-lg font-semibold text-gray-800">Stations</h2>
        <div className="mt-2 flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as StationStatus | "all")}
            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 border p-1"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
          </select>
          <button
            onClick={handleAddNew}
            className="p-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
            title="Add new station"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredRecords.map((station) => (
          <div
            key={station.id}
            className="p-3 border rounded-md bg-gray-50 flex flex-col gap-2 hover:shadow-sm transition-shadow"
            data-testid={`station-card-${station.id}`}
          >
            {editingId === station.id ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full text-sm p-1 border rounded"
                />
                <input
                  type="text"
                  value={editForm.teacher || ""}
                  onChange={(e) => setEditForm({ ...editForm, teacher: e.target.value })}
                  className="w-full text-sm p-1 border rounded"
                />
                <input
                  type="number"
                  value={editForm.capacity || 0}
                  onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) })}
                  className="w-full text-sm p-1 border rounded"
                />
                <div className="flex justify-end gap-2 mt-1">
                  <button onClick={() => setEditingId(null)} className="text-xs text-gray-500">Cancel</button>
                  <button onClick={handleSave} className="text-xs text-primary font-semibold">Save</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{station.name}</h3>
                    <p className="text-xs text-gray-500">{station.teacher} • {station.capacity} cap</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(station)} className="text-gray-400 hover:text-gray-600 p-1">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteStation(station.id)} className="text-gray-400 hover:text-red-600 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    station.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    station.status === 'ready' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {station.status}
                  </span>
                  {station.lane && (
                    <span className="text-xs text-gray-400">{station.lane}</span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        {filteredRecords.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-4">No stations found.</div>
        )}
      </div>
    </div>
  );
}
