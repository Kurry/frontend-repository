import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { DESTINATIONS, CAMPUS_NODES } from './fixture';
import Map from './Map';
import FloorStack from './FloorStack';

import { useRef } from 'react';

export default function App() {
  const {
    stops, addStop, removeStop, reorderStops,
    profile, setProfile,
    departureTime, setDepartureTime,
    route, updateStop,
    activeFloor, activeBuilding, setActiveFloor,
    loadSession
  } = useStore();

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    const handler = () => {
      setShowImport(true);
      setImportError('');
    };
    document.addEventListener('open-import-modal', handler);
    return () => document.removeEventListener('open-import-modal', handler);
  }, []);

  useEffect(() => {
    if (showImport && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [showImport]);

  const handleDialogClick = (e) => {
    if (e.target === dialogRef.current) {
      setShowImport(false);
    }
  };

  const handleExport = () => {
    const geojson = {
      type: "FeatureCollection",
      features: route ? [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: route.segments.map(s => {
              const node = CAMPUS_NODES.find(n => n.id === s.from);
              return [node.lng, node.lat];
            })
          },
          properties: {
            routeSignature: "generated-sig",
            duration: route.duration,
            distance: route.distance
          }
        }
      ] : []
    };

    const data = {
      schemaVersion: "layered-campus-route/v1",
      profile,
      departureTime,
      stops,
      routeSegments: route ? route.segments : [],
      exportedAt: new Date().toISOString(),
      geojson
    };
    alert(JSON.stringify(data, null, 2));
  };

  const handleImportSubmit = () => {
    try {
      const data = JSON.parse(importText);
      if (data.schemaVersion === "layered-campus-route/v1") {
        loadSession(data);
        setShowImport(false);
      } else {
        setImportError("Invalid schemaVersion");
      }
    } catch (e) {
      setImportError("Invalid JSON format. Please provide a valid layered-campus-route/v1 JSON configuration.");
    }
  };

  const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const projectForMiniMap = (lng, lat) => {
    const minX = -73.9630, maxX = -73.9610;
    const minY = 40.8070, maxY = 40.8085;
    const width = 600;
    const height = 400;
    const x = ((lng - minX) / (maxX - minX)) * width;
    const y = ((maxY - lat) / (maxY - minY)) * height;
    return { x, y };
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden font-sans text-sm relative">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-blue-600">Skip to content</a>
      {showImport && (
        <dialog
          ref={dialogRef}
          onClick={handleDialogClick}
          onClose={() => setShowImport(false)}
          className="bg-white p-4 rounded shadow-xl w-96 flex flex-col gap-4 backdrop:bg-black/50 m-auto z-50"
        >
          <h2 className="font-bold">Import Route JSON</h2>
          <textarea
            className="w-full h-32 border border-slate-300 rounded p-2"
            value={importText}
            onChange={e => {
              setImportText(e.target.value);
              setImportError('');
            }}
            placeholder="Paste JSON here..."
          />
          {importError && (
            <div aria-live="polite" className="text-red-600 text-xs mt-1 font-medium bg-red-50 p-2 rounded border border-red-200">
              {importError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowImport(false)} className="px-3 py-1 min-h-[44px] bg-slate-200 rounded">Cancel</button>
            <button onClick={handleImportSubmit} className="px-3 py-1 min-h-[44px] bg-blue-600 text-white rounded">Import</button>
          </div>
        </dialog>
      )}

      <header className="flex-none p-4 bg-white border-b border-slate-200 flex items-center justify-between z-10 shadow-sm">
        <h1 className="text-lg md:text-xl font-bold text-slate-800">Multilevel Accessible Route Lab</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-3 py-1.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">Export</button>
          <button onClick={() => setShowImport(true)} className="px-3 py-1.5 bg-slate-200 text-slate-800 rounded font-medium hover:bg-slate-300">Import</button>
        </div>
      </header>

      <main id="main-content" className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative">
        {/* Sidebar */}
        <nav aria-label="Route Planner Settings" className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col overflow-y-auto shrink-0 z-20 shadow-md md:shadow-none">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold mb-2">Destinations</h2>
            <div className="flex flex-wrap gap-2">
              {DESTINATIONS.map(d => (
                <button
                  key={d.id}
                  onClick={() => addStop(d.id)}
                  className="px-2 py-1 text-xs bg-slate-100 border border-slate-300 rounded hover:bg-slate-200"
                >
                  + {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold mb-2">Itinerary</h2>
            {stops.length === 0 && <p className="text-slate-500 text-xs">No stops added. Add a destination from the list above to create your route.</p>}
            <ul className="space-y-2">
              {stops.map((stop, i) => (
                <li key={stop.id} className="animate-slide-in flex flex-col p-2 bg-slate-50 border border-slate-200 rounded shadow-sm">
                  {confirmDelete === stop.id ? (
                    <div className="flex flex-col gap-2 items-center justify-center p-2">
                      <span className="text-xs font-bold text-slate-700">Delete stop?</span>
                      <div className="flex gap-2 w-full justify-center">
                        <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 bg-slate-200 rounded text-xs min-h-[44px] md:min-h-0 flex-1">Cancel</button>
                        <button onClick={() => { setConfirmDelete(null); removeStop(stop.id); }} className="px-2 py-1 bg-red-500 text-white rounded text-xs min-h-[44px] md:min-h-0 flex-1">Confirm</button>
                      </div>
                    </div>
                  ) : (
                    <>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{stop.order}. {stop.label}</span>
                    <button title="Remove stop" aria-label="Remove stop" onClick={() => setConfirmDelete(stop.id)} className="text-red-500 hover:text-red-700 text-xs font-bold p-1 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0">✕</button>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label htmlFor={`dwell-${stop.id}`} className="text-xs text-slate-600">Dwell (min):</label>
                      <div className="relative">
                        <input
                          id={`dwell-${stop.id}`}
                          type="number"
                          min="0" max="30"
                          value={stop.dwell}
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 0;
                            val = Math.max(0, val);
                            updateStop(stop.id, { dwell: val });
                          }}
                          className={`w-16 px-1 border border-slate-300 rounded text-xs min-h-[44px] md:min-h-0 ${stop.dwell < 0 ? 'border-red-500' : ''}`}
                        />
                        {stop.dwell < 0 && <span className="absolute -bottom-4 left-0 text-[10px] text-red-500 w-max">Cannot be negative</span>}
                      </div>
                    </div>
                    {i > 0 && (
                      <button onClick={() => reorderStops(i, i - 1)} className="text-xs text-blue-600 font-medium min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center">↑ Up</button>
                    )}
                  </div>
                  </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold mb-2">Profile & Time</h2>
            <select
              aria-label="Select Mobility Profile"
              value={profile}
              onChange={e => setProfile(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] md:min-h-0"
            >
              <option value="standard">Standard</option>
              <option value="step-free">Step-free</option>
              <option value="low-slope">Low-slope</option>
            </select>
            <div className="flex items-center gap-4">
              <input
                aria-label="Select Departure Time"
                type="range"
                min={8 * 60}
                max={20 * 60}
                step={5}
                value={departureTime}
                onChange={e => setDepartureTime(parseInt(e.target.value))}
                className="flex-1 cursor-pointer min-h-[44px] md:min-h-0"
              />
              <span className="font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">{formatTime(departureTime)}</span>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <h2 className="font-bold mb-2">Turn List</h2>
            {route ? (
              <ul className="space-y-2">
                {route.segments.map((seg, i) => (
                  <li key={i} className="p-3 bg-blue-50/50 border border-blue-100 rounded text-xs">
                    <div className="font-medium text-blue-900 mb-1">
                      {seg.instruction}
                      {seg.type === 'elevator' && <span className="ml-1 px-1 bg-purple-100 text-purple-800 rounded">Elevator</span>}
                      {seg.type === 'stair' && <span className="ml-1 px-1 bg-orange-100 text-orange-800 rounded">Stairs</span>}
                    </div>
                    <div className="text-slate-500 flex flex-col gap-0.5 border-t border-blue-200/50 pt-1">
                      <div className="flex justify-between">
                        <span>Segment ID: {seg.id}</span>
                        <span>{seg.distance}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration: {seg.duration.toFixed(1)} min</span>
                        <span>Arrive: {formatTime(seg.arrivalTime)}</span>
                      </div>
                    </div>
                  </li>
                ))}
                <li className="mt-4 font-bold text-xs border-t border-slate-200 pt-3 flex flex-col gap-1">
                  <div className="flex justify-between"><span>Total Duration:</span> <span>{route.duration.toFixed(1)} min</span></div>
                  <div className="flex justify-between"><span>Total Distance:</span> <span>{route.distance}m</span></div>
                  <div className="flex justify-between text-blue-700"><span>Est. Arrival:</span> <span>{formatTime(route.arrivalTime)}</span></div>
                </li>
              </ul>
            ) : (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded text-orange-800 text-xs">
                {stops.length < 2 ? "Add at least 2 stops to generate a route." : "No valid path found. Check closures or profile constraints."}
              </div>
            )}
          </div>
        </nav>

        {/* Map Area */}
        <section className="flex-1 bg-slate-100 relative p-4 flex flex-col md:flex-row gap-4 overflow-hidden min-h-[300px]">
          <div className="flex-1 bg-white shadow-sm rounded border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-slate-700 flex items-center gap-2">
                Campus Map
                {activeBuilding && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-normal">Inside {activeBuilding}</span>}
              </h2>
              <div className="flex gap-2 text-xs">
                {['Library', 'Science'].map(b => (
                  <button
                    key={b}
                    onClick={() => setActiveFloor(1, b)}
                    className={`px-3 py-1.5 rounded transition-colors ${activeBuilding === b ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {activeBuilding === b ? 'Exit' : `Enter ${b}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 relative overflow-hidden bg-slate-50/50">
              <Map route={route} activeBuilding={activeBuilding} activeFloor={activeFloor} />
            </div>
          </div>

          {activeBuilding && (
            <div className="w-full md:w-48 shrink-0">
              <FloorStack
                activeBuilding={activeBuilding}
                activeFloor={activeFloor}
                onSelectFloor={(b, f) => setActiveFloor(f, b)}
                project={projectForMiniMap}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
