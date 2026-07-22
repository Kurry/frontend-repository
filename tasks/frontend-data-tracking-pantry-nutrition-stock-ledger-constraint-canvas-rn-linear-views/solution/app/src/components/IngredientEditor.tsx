import React, { useState, useEffect } from "react";
import { useAppStore } from "../store";
import type { DomainStatus, IngredientRecord } from "../types";
import { Plus, Edit2, Trash2 } from "lucide-react";

export const IngredientEditor = () => {
  const { state, dispatch } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<IngredientRecord>>({});
  const [error, setError] = useState<string | null>(null);

  const selectedRecord = state.records.find((r) => r.id === state.selectedRecordId);

  useEffect(() => {
    if (selectedRecord && isEditing) {
      setFormData(selectedRecord);
    } else if (!isEditing) {
      setFormData({});
      setError(null);
    }
  }, [selectedRecord, isEditing]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError("Name is required");
      return;
    }
    if (formData.quantity === undefined || formData.quantity < 0) {
      setError("Quantity must be 0 or greater");
      return;
    }
    if (!formData.unit?.trim()) {
      setError("Unit is required");
      return;
    }

    if (selectedRecord) {
      dispatch({
        type: "UPDATE_RECORD",
        payload: { ...selectedRecord, ...formData } as IngredientRecord,
      });
    } else {
      const newRecord: IngredientRecord = {
        id: crypto.randomUUID(),
        name: formData.name.trim(),
        quantity: formData.quantity,
        unit: formData.unit.trim(),
        status: formData.status || "empty",
        notes: formData.notes || "",
        constraintCanvasState: { x: 0, y: 0 },
      };
      dispatch({ type: "CREATE_RECORD", payload: newRecord });
    }
    setIsEditing(false);
    setFormData({});
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
    setError(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 sticky top-0 bg-white z-10 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800">Ingredients</h2>
        {!isEditing && (
          <button
            onClick={() => {
              dispatch({ type: "SELECT_RECORD", payload: null });
              setIsEditing(true);
            }}
            className="p-1 text-slate-600 hover:bg-slate-100 rounded"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {isEditing ? (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseFloat(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                <input
                  type="text"
                  value={formData.unit || ""}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.status || "empty"}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as DomainStatus })}
                className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="empty">Empty</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-2">
            {state.records.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-8">
                No ingredients yet. Click + to add one.
              </div>
            ) : (
              state.records.map((record) => (
                <div
                  key={record.id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    state.selectedRecordId === record.id
                      ? "border-blue-400 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  onClick={() => dispatch({ type: "SELECT_RECORD", payload: record.id })}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-slate-800">{record.name}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize border border-slate-200">
                      {record.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 flex justify-between">
                    <span>
                      {record.quantity} {record.unit}
                    </span>
                    {state.selectedRecordId === record.id && (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                          }}
                          className="p-1 hover:bg-blue-100 rounded text-blue-700"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch({ type: "DELETE_RECORD", payload: record.id });
                          }}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
