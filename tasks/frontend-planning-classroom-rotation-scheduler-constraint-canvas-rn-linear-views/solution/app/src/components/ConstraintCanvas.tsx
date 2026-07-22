import { useState, useEffect } from "react";
import { Station } from "../types";
import { getState, subscribe, moveStation, validateMove } from "../store";

const LANES = ["Lane 1", "Lane 2", "Lane 3"];

export function ConstraintCanvas() {
  const [records, setRecords] = useState<Station[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  useEffect(() => {
    setRecords(getState().records);
    const unsubscribe = subscribe(() => setRecords(getState().records));
    return () => unsubscribe();
  }, []);

  const activeRecords = records.filter(r => r.status !== "archived");
  const unassigned = activeRecords.filter(r => !r.lane);

  const handleDragStart = (e: React.DragEvent, stationId: string) => {
    e.dataTransfer.setData("text/plain", stationId);
    setSelectedStationId(stationId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, lane: string | null) => {
    e.preventDefault();
    const stationId = e.dataTransfer.getData("text/plain");
    const err = validateMove(stationId, lane);
    if (err) {
      setErrorMsg(err);
      setTimeout(() => setErrorMsg(null), 3000);
    } else {
      moveStation(stationId, lane);
      setSelectedStationId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, stationId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (selectedStationId === stationId) {
        setSelectedStationId(null);
      } else {
        setSelectedStationId(stationId);
      }
    }
  };

  const handleLaneKeyDown = (e: React.KeyboardEvent, lane: string | null) => {
    if (e.key === "Enter" && selectedStationId) {
      e.preventDefault();
      const err = validateMove(selectedStationId, lane);
      if (err) {
        setErrorMsg(err);
        setTimeout(() => setErrorMsg(null), 3000);
      } else {
        moveStation(selectedStationId, lane);
        setSelectedStationId(null);
      }
    }
  };

  const renderStationCard = (station: Station) => {
    const isSelected = selectedStationId === station.id;
    // For conflict styling simulation based on active error
    const isConflict = errorMsg !== null && isSelected;

    return (
      <div
        key={station.id}
        draggable
        onDragStart={(e) => handleDragStart(e, station.id)}
        onKeyDown={(e) => handleKeyDown(e, station.id)}
        tabIndex={0}
        data-testid={`canvas-station-${station.id}`}
        className={`p-2 bg-white border rounded shadow-sm cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 motion-reduce:transition-none
          ${isSelected ? 'ring-2 ring-blue-400 border-blue-400 transform scale-105 motion-reduce:transform-none' : 'border-gray-200'}
          ${isConflict ? 'bg-red-50 border-red-300' : ''}
        `}
      >
        <div className="text-sm font-medium">{station.name}</div>
        <div className="text-xs text-gray-500">{station.teacher}</div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden relative">
      {errorMsg && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-md transition-opacity duration-300">
          {errorMsg}
        </div>
      )}

      <div className="flex-1 overflow-x-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 h-full min-w-max md:min-w-0">
          {LANES.map(lane => (
            <div
              key={lane}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, lane)}
              onKeyDown={(e) => handleLaneKeyDown(e, lane)}
              tabIndex={0}
              className={`flex-1 min-w-[250px] bg-gray-100 rounded-lg p-4 flex flex-col gap-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors
                ${selectedStationId ? 'bg-gray-200 border-2 border-dashed border-gray-400' : 'border-2 border-transparent'}
              `}
              data-testid={`lane-${lane}`}
            >
              <h3 className="font-semibold text-gray-700 sticky top-0 bg-gray-100 py-1 z-10">{lane}</h3>
              <div className="flex-1 overflow-y-auto space-y-2 pb-2">
                {activeRecords.filter(r => r.lane === lane).map(renderStationCard)}
              </div>
            </div>
          ))}

          {/* Unassigned Lane */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null)}
            onKeyDown={(e) => handleLaneKeyDown(e, null)}
            tabIndex={0}
            className={`flex-1 min-w-[250px] bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors
              ${selectedStationId ? 'bg-gray-50 border-2 border-dashed border-gray-300' : ''}
            `}
            data-testid="lane-unassigned"
          >
            <h3 className="font-semibold text-gray-700 sticky top-0 bg-white py-1 z-10">Unassigned</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pb-2">
              {unassigned.map(renderStationCard)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
