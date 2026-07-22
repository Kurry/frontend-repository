import React, { useRef, useState, useEffect } from 'react';
import { useStations } from '../context/StationsContext';
import type { StationRecord } from '../types';
import { ArrowLeftRight, HelpCircle } from 'lucide-react';

export const SpatialComposer: React.FC = () => {
  const { state, dispatch } = useStations();
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRebalancing, setIsRebalancing] = useState(true);

  const placedRecords = state.records.filter(r => r.position);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Conflicting check - rudimentary distance
    const conflict = placedRecords.find(r => r.id !== selectedId && r.position &&
        Math.hypot(r.position.x - x, r.position.y - y) < 80);

    if (conflict) {
        alert("Conflict: Cannot place station too close to another.");
        return;
    }

    dispatch({
        type: 'PLACE_IN_COMPOSER',
        payload: { id: selectedId, position: { x, y }, rebalance: isRebalancing }
    });
    setSelectedId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, record: StationRecord) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedId(selectedId === record.id ? null : record.id);
    }
  };

  // Keyboard navigation for placement when an item is selected
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
         e.preventDefault();
         const record = state.records.find(r => r.id === selectedId);
         if (!record) return;

         const step = 20;
         let newPos = record.position ? { ...record.position } : { x: 200, y: 200 };

         if (e.key === 'ArrowUp') newPos.y -= step;
         if (e.key === 'ArrowDown') newPos.y += step;
         if (e.key === 'ArrowLeft') newPos.x -= step;
         if (e.key === 'ArrowRight') newPos.x += step;

         dispatch({
            type: 'PLACE_IN_COMPOSER',
            payload: { id: selectedId, position: newPos, rebalance: isRebalancing }
         });
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedId, isRebalancing, state.records, dispatch]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            Spatial Composer
            <div className="ml-2 group relative cursor-help">
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-gray-800 text-white text-xs rounded hidden group-hover:block z-10">
                Select a station below, then click on the canvas to place it. Use arrow keys to nudge.
              </div>
            </div>
          </h2>
        </div>
        <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isRebalancing}
            onChange={(e) => setIsRebalancing(e.target.checked)}
            className="rounded text-primary-600 focus:ring-primary-500"
          />
          <span className="flex items-center"><ArrowLeftRight className="w-4 h-4 mr-1" /> Auto-rebalance</span>
        </label>
      </div>

      <div
        ref={containerRef}
        className="flex-1 bg-gray-50 relative overflow-hidden cursor-crosshair border-b border-gray-200"
        onClick={handleCanvasClick}
      >
        {/* Background Grid Pattern */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

        {placedRecords.map(record => (
          <div
            key={record.id}
            onClick={(e) => { e.stopPropagation(); setSelectedId(record.id); }}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out cursor-pointer group
              ${selectedId === record.id ? 'ring-2 ring-primary-500 ring-offset-2 scale-105 z-10' : 'hover:scale-105 z-0'}`}
            style={{ left: record.position?.x, top: record.position?.y }}
            title="Click to select and move"
          >
            <div className={`w-32 p-3 bg-white border-2 rounded-xl shadow-md flex flex-col items-center text-center
              ${record.status === 'changed' ? 'border-green-400' : 'border-blue-400'}`}>
              <div className="font-semibold text-sm text-gray-800 line-clamp-2">{record.title}</div>
              <div className="text-xs text-gray-500 mt-1">Cap: {record.studentsAssigned}/{record.capacity}</div>
            </div>
          </div>
        ))}

        {selectedId && !placedRecords.find(r => r.id === selectedId) && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span className="bg-primary-600 text-white px-4 py-2 rounded-full font-medium text-sm shadow-lg animate-pulse">
              Click anywhere on canvas to place
            </span>
          </div>
        )}
      </div>

      {/* Selection Tray */}
      <div className="p-4 bg-white overflow-x-auto">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Available for Placement</h3>
        <div className="flex space-x-3 pb-2">
          {state.records.filter(r => !r.position && r.status !== 'archived').map(record => (
            <button
              key={record.id}
              onClick={() => setSelectedId(selectedId === record.id ? null : record.id)}
              onKeyDown={(e) => handleKeyDown(e, record)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors
                ${selectedId === record.id
                  ? 'border-primary-500 bg-primary-50 text-primary-800'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}
            >
              {record.title}
            </button>
          ))}
          {state.records.filter(r => !r.position && r.status !== 'archived').length === 0 && (
            <div className="text-sm text-gray-400 italic">All active stations placed.</div>
          )}
        </div>
      </div>
    </div>
  );
};
