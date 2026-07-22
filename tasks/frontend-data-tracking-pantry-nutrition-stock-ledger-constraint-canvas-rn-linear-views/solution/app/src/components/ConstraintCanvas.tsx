import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "../store";
import type { DomainStatus } from "../types";

const LANES: { id: DomainStatus; label: string; color: string }[] = [
  { id: "empty", label: "Empty", color: "bg-slate-100" },
  { id: "draft", label: "Draft", color: "bg-orange-100" },
  { id: "ready", label: "Ready", color: "bg-yellow-100" },
  { id: "changed", label: "Changed", color: "bg-blue-100" },
  { id: "archived", label: "Archived", color: "bg-green-100" },
];

export const ConstraintCanvas = () => {
  const { state, dispatch } = useAppStore();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global keydown for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: "UNDO" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: DomainStatus) => {
    e.preventDefault();
    if (draggedId) {
      dispatch({ type: "UPDATE_STATUS", payload: { id: draggedId, status } });
    }
    setDraggedId(null);
  };

  // Keyboard navigation for statuses
  const handleKeyDownItem = (e: React.KeyboardEvent, id: string, currentStatus: DomainStatus) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const currentIndex = LANES.findIndex((l) => l.id === currentStatus);
      let newIndex = currentIndex;
      if (e.key === "ArrowRight" && currentIndex < LANES.length - 1) {
        newIndex = currentIndex + 1;
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        newIndex = currentIndex - 1;
      }
      if (newIndex !== currentIndex) {
        dispatch({ type: "UPDATE_STATUS", payload: { id, status: LANES[newIndex].id } });
      }
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      dispatch({ type: "SELECT_RECORD", payload: id });
    }
  };

  const derivedSummary = {
    total: state.records.length,
    counts: LANES.reduce((acc, lane) => {
      acc[lane.id] = state.records.filter((r) => r.status === lane.id).length;
      return acc;
    }, {} as Record<DomainStatus, number>),
  };

  return (
    <div className="flex flex-col h-full gap-4 relative" ref={containerRef}>
      {/* Derived Summary Bar */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center sticky top-0 z-10">
        <div className="text-sm font-semibold text-slate-700 mr-4">Summary:</div>
        <div className="text-sm font-medium text-slate-600">Total: {derivedSummary.total}</div>
        {LANES.map((lane) => (
          <div key={`summary-${lane.id}`} className="text-sm text-slate-600 flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${lane.color} border border-slate-300`}></span>
            {lane.label}: {derivedSummary.counts[lane.id]}
          </div>
        ))}
      </div>

      {/* Canvas Lanes */}
      <div className="flex-1 flex gap-4 min-h-[400px] overflow-x-auto pb-4">
        {LANES.map((lane) => (
          <div
            key={lane.id}
            className={`flex-1 min-w-[200px] flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, lane.id)}
          >
            <div className={`p-3 border-b border-slate-200 font-medium text-slate-800 ${lane.color}`}>
              {lane.label}
              <span className="ml-2 text-xs text-slate-500 bg-white/50 px-2 py-0.5 rounded-full">
                {derivedSummary.counts[lane.id]}
              </span>
            </div>
            <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto bg-slate-50/50">
              {state.records
                .filter((r) => r.status === lane.id)
                .map((record) => (
                  <div
                    key={record.id}
                    draggable
                    tabIndex={0}
                    onDragStart={(e) => handleDragStart(e, record.id)}
                    onKeyDown={(e) => handleKeyDownItem(e, record.id, record.status)}
                    onClick={() => dispatch({ type: "SELECT_RECORD", payload: record.id })}
                    className={`p-3 bg-white border rounded shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      state.selectedRecordId === record.id ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-200"
                    } ${draggedId === record.id ? "opacity-50" : "opacity-100"}`}
                  >
                    <div className="font-medium text-slate-800 mb-1 break-words">{record.name}</div>
                    <div className="text-xs text-slate-500">
                      {record.quantity} {record.unit}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
