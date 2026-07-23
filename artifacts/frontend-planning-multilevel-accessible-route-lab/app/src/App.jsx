import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { DESTINATIONS, CAMPUS_NODES } from './fixture';
import Map from './Map';
import FloorStack from './FloorStack';

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

  useEffect(() => {
    const handler = () => setShowImport(true);
    document.addEventListener('open-import-modal', handler);
    return () => document.removeEventListener('open-import-modal', handler);
  }, []);

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
        alert("Invalid schemaVersion");
      }
    } catch (e) {
      alert("Invalid JSON");
    }
  };

  const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden font-sans text-sm relative">
      {showImport && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-xl w-96 flex flex-col gap-4">
            <h2 className="font-bold">Import Route JSON</h2>
            <textarea
              className="w-full h-32 border border-slate-300 rounded p-2"
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Paste JSON here..."
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowImport(false)} className="px-3 py-1 bg-slate-200 rounded">Cancel</button>
              <button onClick={handleImportSubmit} className="px-3 py-1 bg-blue-600 text-white rounded">Import</button>
            </div>
          </div>
        </div>
      )}

      <header className="flex-none p-4 bg-white border-b border-slate-200 flex items-center justify-between z-10 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">Multilevel Accessible Route Lab</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-3 py-1.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">Export</button>
          <button onClick={() => setShowImport(true)} className="px-3 py-1.5 bg-slate-200 text-slate-800 rounded font-medium hover:bg-slate-300">Import</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Sidebar */}
        <aside className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col overflow-y-auto shrink-0 z-20 shadow-md md:shadow-none">
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
            {stops.length === 0 && <p className="text-slate-500 text-xs">No stops added.</p>}
            <ul className="space-y-2">
              {stops.map((stop, i) => (
                <li key={stop.id} className="flex flex-col p-2 bg-slate-50 border border-slate-200 rounded shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{stop.order}. {stop.label}</span>
                    <button onClick={() => removeStop(stop.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">✕</button>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-600">Dwell (min):</label>
                      <input
                        type="number"
                        min="0" max="30"
                        value={stop.dwell}
                        onChange={(e) => updateStop(stop.id, { dwell: parseInt(e.target.value) || 0 })}
                        className="w-16 px-1 border border-slate-300 rounded text-xs"
                      />
                    </div>
                    {i > 0 && (
                      <button onClick={() => reorderStops(i, i - 1)} className="text-xs text-blue-600 font-medium">↑ Up</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold mb-2">Profile & Time</h2>
            <select
              value={profile}
              onChange={e => setProfile(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="standard">Standard</option>
              <option value="step-free">Step-free</option>
              <option value="low-slope">Low-slope</option>
            </select>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={8 * 60}
                max={20 * 60}
                step={5}
                value={departureTime}
                onChange={e => setDepartureTime(parseInt(e.target.value))}
                className="flex-1 cursor-pointer"
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
                    <div className="font-medium text-blue-900">{seg.instruction}</div>
                    <div className="text-slate-500 mt-1 flex justify-between">
                      <span>{seg.duration.toFixed(1)} min</span>
                      <span>{seg.distance}m</span>
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
        </aside>

        {/* Map Area */}
        <section className="flex-1 bg-slate-100 relative p-4 flex flex-col md:flex-row gap-4 overflow-hidden">
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
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
