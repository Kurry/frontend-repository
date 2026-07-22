import { useState, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useAppStore } from '../store';
import { Layers, Undo, AlertTriangle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

export function SpatialComposer() {
  const {
    records,
    zones,
    selectedRecordId,
    composerStatus,
    derived,
    placeRecord,
    undoMutation
  } = useAppStore();

  const [activeZone, setActiveZone] = useState<string | null>(null);

  const selectedRecord = records.find(r => r.id === selectedRecordId);

  useEffect(() => {
    // Reset active zone when selection changes to prevent accidental keyboard placement
    setActiveZone(null);
  }, [selectedRecordId]);

  const handlePlace = (zoneId: string) => {
    placeRecord(zoneId);
  };

  const onKeyDown = (e: KeyboardEvent, zoneId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePlace(zoneId);
    }
  };

  // Keyboard undo handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undoMutation();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [undoMutation]);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">

      {/* Header / Toolbar */}
      <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10 relative">
        <div className="flex items-center space-x-3">
          <Layers className="text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Spatial Composer</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-500 font-medium">
            {derived.summary}
          </div>
          <button
            onClick={undoMutation}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
            <span>Undo</span>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-6 overflow-y-auto relative">

        {/* Status indicator for current mutation */}
        {selectedRecordId && (
          <div className="mb-6 bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider mb-1">Selected for Placement</p>
              <h2 className="text-lg font-medium text-slate-800">{selectedRecord?.title}</h2>
              <p className="text-sm text-slate-500 mt-1">Capacity: {selectedRecord?.capacity} • Status: {selectedRecord?.status}</p>
            </div>
            <div className="flex flex-col items-end">
              {composerStatus === 'conflict' && (
                <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-medium">
                  <AlertTriangle size={16} className="mr-1.5" />
                  Capacity Exceeded
                </div>
              )}
              {composerStatus === 'resolved' && (
                <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                  <CheckCircle2 size={16} className="mr-1.5" />
                  Placed Successfully
                </div>
              )}
            </div>
          </div>
        )}

        {/* Zones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {zones.map((zone) => {
            const currentCap = zone.recordIds.reduce((sum, id) => {
              const r = records.find(rec => rec.id === id);
              return sum + (r ? r.capacity : 0);
            }, 0);

            const isSelectable = selectedRecordId !== null;
            const isHoveredOrFocused = activeZone === zone.id;
            const willExceed = selectedRecord
              ? (!zone.recordIds.includes(selectedRecord.id) && currentCap + selectedRecord.capacity > zone.maxCapacity)
              : false;

            return (
              <div
                key={zone.id}
                tabIndex={isSelectable ? 0 : -1}
                onClick={() => isSelectable && handlePlace(zone.id)}
                onKeyDown={(e) => isSelectable && onKeyDown(e, zone.id)}
                onMouseEnter={() => isSelectable && setActiveZone(zone.id)}
                onMouseLeave={() => setActiveZone(null)}
                onFocus={() => isSelectable && setActiveZone(zone.id)}
                onBlur={() => setActiveZone(null)}
                className={clsx(
                  "border-2 rounded-xl p-4 transition-all duration-300 relative min-h-[300px] flex flex-col",
                  {
                    "border-slate-200 bg-white": !isSelectable,
                    "border-blue-300 bg-white cursor-pointer shadow-sm hover:shadow-md": isSelectable && !isHoveredOrFocused,
                    "border-blue-500 bg-blue-50 cursor-pointer shadow-md transform scale-[1.01]": isSelectable && isHoveredOrFocused && !willExceed,
                    "border-red-400 bg-red-50 cursor-not-allowed": isSelectable && isHoveredOrFocused && willExceed
                  }
                )}
              >
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                  <h3 className="font-semibold text-lg text-slate-800">{zone.name}</h3>
                  <div className="text-sm font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">
                    {currentCap} / {zone.maxCapacity} cap
                  </div>
                </div>

                {/* Visual Capacity Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden flex">
                  <div
                    className={clsx("h-full transition-all duration-500 ease-out", {
                      "bg-slate-400": currentCap <= zone.maxCapacity * 0.8,
                      "bg-yellow-400": currentCap > zone.maxCapacity * 0.8 && currentCap <= zone.maxCapacity,
                      "bg-red-500": currentCap > zone.maxCapacity
                    })}
                    style={{ width: `${Math.min(100, (currentCap / zone.maxCapacity) * 100)}%` }}
                  />
                  {/* Preview phantom bar if hovering and valid */}
                  {isSelectable && isHoveredOrFocused && !willExceed && selectedRecord && !zone.recordIds.includes(selectedRecord.id) && (
                    <div
                      className="h-full bg-blue-400 opacity-60 transition-all duration-300"
                      style={{ width: `${(selectedRecord.capacity / zone.maxCapacity) * 100}%` }}
                    />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  {zone.recordIds.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-lg">
                      Empty Zone
                    </div>
                  ) : (
                    zone.recordIds.map(id => {
                      const r = records.find(rec => rec.id === id);
                      if (!r) return null;
                      return (
                        <div
                          key={r.id}
                          className={clsx(
                            "p-3 rounded-lg border text-sm transition-all duration-300",
                            {
                              "bg-white border-slate-200 shadow-sm": selectedRecordId !== r.id,
                              "bg-blue-100 border-blue-400 ring-2 ring-blue-200 z-10 relative": selectedRecordId === r.id
                            }
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-700 break-words">{r.title}</span>
                            <span className="text-slate-500 bg-slate-50 px-2 py-0.5 rounded text-xs">Cap {r.capacity}</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
