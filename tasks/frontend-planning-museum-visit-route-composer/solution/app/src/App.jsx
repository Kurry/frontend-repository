import React, { useState, useEffect } from 'react';
import { EXHIBITS, SPECIAL_NODES, VISITORS, VISIT_BUDGET, START_TIME, getDistance, TIMED_WINDOWS } from './fixture';

export default function App() {
  const [view, setView] = useState('plan'); // plan, export

  // State
  const [route, setRoute] = useState([]);
  const [dwellTimes, setDwellTimes] = useState({});
  const [clock, setClock] = useState(START_TIME);

  // Matrix Selections
  const [selections, setSelections] = useState({}); // { exhibitId: { v1: 'must', v2: 'skip', group: 'optional' } }

  const [reservations, setReservations] = useState([]); // {id, windowId, state}
  const [rehearsalEvent, setRehearsalEvent] = useState(null);

  const [branches, setBranches] = useState([]); // Array of branches for split
  const [annotations, setAnnotations] = useState([]);

  // Calculate timelines
  const calculateTimeline = () => {
     let currentTime = START_TIME;
     let lastNode = 'entrance';
     const timeline = [];

     for (const stop of route) {
         if (stop.kind === 'split') {
             // Mock branch timeline
             timeline.push({ type: 'split', node: stop, start: currentTime });
             continue;
         }
         if (stop.kind === 'rejoin') {
             timeline.push({ type: 'rejoin', node: stop, start: currentTime });
             continue;
         }

         const travelTime = getDistance(lastNode, stop.id);
         const arrivalTime = currentTime + travelTime;
         const dwell = dwellTimes[stop.id] || 15;
         const departureTime = arrivalTime + dwell;

         timeline.push({
             node: stop,
             travelTime,
             arrivalTime,
             dwell,
             departureTime
         });

         currentTime = departureTime;
         lastNode = stop.id;
     }

     return timeline;
  };

  const timeline = calculateTimeline();

  // WebMCP State Exposure
  useEffect(() => {
    window.webmcp_session_info = () => ({
      app: "Museum Visit Route Composer",
      version: "1.0",
      route_length: route.length,
      current_time: clock,
      active_view: view
    });

    window.webmcp_list_tools = () => [
      { name: "editor_select", description: "Select an object" },
      { name: "editor_update_property", description: "Update property" },
      { name: "editor_switch_mode", description: "Switch mode" },
      { name: "entity_select", description: "Select reservation" },
      { name: "entity_update", description: "Update reservation" },
      { name: "entity_create", description: "Create reservation" },
      { name: "entity_delete", description: "Delete reservation" },
      { name: "artifact_export", description: "Export session" },
      { name: "artifact_import", description: "Import session" },
      { name: "command_submit", description: "Submit command" },
      { name: "command_advance_clock", description: "Advance clock" }
    ];

    window.webmcp_invoke_tool = (tool_name, args) => {
      console.log("WebMCP Invoked:", tool_name, args);

      if (tool_name === "editor_update_property") {
        if (args.property === "dwell_time" && args.object_id) {
          setDwellTimes(prev => ({ ...prev, [args.object_id]: args.value }));
          return { success: true };
        }
      }

      if (tool_name === "command_advance_clock") {
        setClock(c => c + (args.minutes || 10));
        return { success: true };
      }

      if (tool_name === "artifact_export") {
        setView('export');
        return { success: true, format: args.format || 'session-json' };
      }

      if (tool_name === "artifact_import") {
        try {
          const data = JSON.parse(args.data);
          if (data.schemaVersion === "museum-visit-plan/v1") {
             setRoute(data.route || []);
             setDwellTimes(data.dwellTimes || {});
             setClock(data.clock || START_TIME);
             return { success: true };
          }
        } catch (e) {}
        return { success: false, error: "Invalid import" };
      }

      return { success: true, _ignored: true };
    };
  }, [route, dwellTimes, clock, view]);

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
  };

  const handleDropRoute = (e) => {
    e.preventDefault();
    try {
      const item = JSON.parse(e.dataTransfer.getData('application/json'));
      if (!route.find(r => r.id === item.id)) {
        setRoute([...route, item]);
        setDwellTimes({ ...dwellTimes, [item.id]: item.dwellRange ? item.dwellRange[0] : 15 });
      }
    } catch (e) {}
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const generateExportData = () => {
    return JSON.stringify({
      schemaVersion: "museum-visit-plan/v1",
      exportedAt: new Date().toISOString(),
      clock,
      route,
      dwellTimes,
      reservations,
      branches,
      selections
    }, null, 2);
  };

  const formatTime = (mins) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}:${m.toString().padStart(2, '0')}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center z-10">
        <div>
           <h1 className="text-xl font-bold text-gray-800">Museum Visit Route Composer</h1>
           <p className="text-sm text-gray-500">Northlight Museum • Logical Clock: {formatTime(clock)}</p>
        </div>
        <div className="space-x-4">
           <button onClick={() => setView('plan')} className={`px-4 py-2 rounded font-medium ${view === 'plan' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Plan</button>
           <button onClick={() => setView('export')} className={`px-4 py-2 rounded font-medium ${view === 'export' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Export</button>
        </div>
      </header>

      <main className="flex-1 p-4 flex overflow-hidden">
        {view === 'plan' ? (
          <div className="flex gap-4 w-full h-full">

            {/* LEFT: Matrix & Exhibits */}
            <div className="w-1/3 bg-white p-4 rounded shadow overflow-y-auto flex flex-col">
              <h2 className="font-bold mb-2">Exhibit Selection & Interests</h2>

              <div className="text-xs mb-4 text-gray-600">
                  Select preferences for group members. Drag exhibits to route.
              </div>

              <div className="grid grid-cols-6 gap-1 mb-2 text-xs font-bold border-b pb-1">
                 <div className="col-span-2">Exhibit</div>
                 <div>V1 (A)</div>
                 <div>V2 (B)</div>
                 <div>V3 (C)</div>
                 <div>V4 (D)</div>
              </div>

              <div className="space-y-1 flex-1 overflow-y-auto">
                {EXHIBITS.map(ex => (
                  <div
                    key={ex.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ex)}
                    className="grid grid-cols-6 gap-1 items-center p-2 bg-blue-50 border border-blue-200 rounded cursor-grab hover:bg-blue-100"
                    data-testid={`exhibit-${ex.id}`}
                  >
                    <div className="col-span-2 leading-tight">
                        <div className="font-medium text-sm truncate" title={ex.name}>{ex.name}</div>
                        <div className="text-xs text-gray-600">Fl {ex.floor} • {ex.dwellRange[0]}m+</div>
                        {ex.required && <span className="text-[10px] bg-red-100 text-red-800 px-1 rounded inline-block">Req</span>}
                    </div>

                    {['v1', 'v2', 'v3', 'v4'].map(vid => (
                        <select
                           key={vid}
                           className="text-xs border rounded p-1 w-full bg-white"
                           value={selections[ex.id]?.[vid] || 'neutral'}
                           onChange={(e) => setSelections(prev => ({
                               ...prev,
                               [ex.id]: { ...(prev[ex.id] || {}), [vid]: e.target.value }
                           }))}
                        >
                            <option value="must">Must</option>
                            <option value="optional">Opt</option>
                            <option value="neutral">-</option>
                            <option value="skip">Skip</option>
                        </select>
                    ))}
                  </div>
                ))}
              </div>

              <h2 className="font-bold mt-4 mb-2">Special Nodes</h2>
              <div className="flex flex-wrap gap-2">
                 {SPECIAL_NODES.map(node => (
                     <div
                       key={node.id}
                       draggable
                       onDragStart={(e) => handleDragStart(e, node)}
                       className="px-2 py-1 bg-green-50 border border-green-200 rounded text-sm cursor-grab"
                     >
                        {node.name}
                     </div>
                 ))}
              </div>
            </div>

            {/* MIDDLE: Route Canvas & Timeline */}
            <div className="flex-1 bg-white p-4 rounded shadow flex flex-col relative">
              <h2 className="font-bold mb-4">Floor Route Canvas & Timeline</h2>
              <div
                className="flex-1 border-2 border-dashed border-gray-300 rounded p-4 flex flex-col gap-2 overflow-y-auto"
                onDrop={handleDropRoute}
                onDragOver={handleDragOver}
                data-testid="route-canvas"
              >
                {timeline.length === 0 ? (
                  <div className="text-gray-400 text-center m-auto">Drag exhibits and nodes here to build route</div>
                ) : (
                  timeline.map((step, idx) => {
                      if (step.type === 'split') {
                          return <div key={`split-${idx}`} className="bg-purple-100 text-purple-800 p-2 rounded text-center text-sm font-bold border border-purple-300">SPLIT GROUP</div>
                      }
                      if (step.type === 'rejoin') {
                          return <div key={`rejoin-${idx}`} className="bg-purple-100 text-purple-800 p-2 rounded text-center text-sm font-bold border border-purple-300">REJOIN GROUP</div>
                      }

                      const item = step.node;
                      return (
                        <div key={`${item.id}-${idx}`} className="bg-white border p-3 rounded shadow-sm flex flex-col">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="text-xs text-gray-500 w-12 text-right">
                                    {formatTime(step.arrivalTime)}<br/>↓
                                </div>
                                <div>
                                  <div className="font-medium text-lg">{item.name}</div>
                                  <div className="text-sm text-gray-500">Floor {item.floor} • Travel: {step.travelTime}m</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {(item.kind === 'exhibit' || item.kind === 'rest' || item.kind === 'cafe') && (
                                    <div className="flex flex-col items-end">
                                      <span className="text-xs text-gray-500">Dwell ({dwellTimes[item.id]}m)</span>
                                      <input
                                        type="range"
                                        min={item.dwellRange?.[0] || 5}
                                        max={item.dwellRange?.[1] || 60}
                                        value={dwellTimes[item.id] || 15}
                                        onChange={(e) => setDwellTimes({...dwellTimes, [item.id]: parseInt(e.target.value)})}
                                        className="w-24"
                                      />
                                    </div>
                                )}
                                <button onClick={() => {
                                  const newRoute = [...route];
                                  newRoute.splice(idx, 1);
                                  setRoute(newRoute);
                                }} className="text-red-500 text-sm">Remove</button>
                              </div>
                          </div>

                          {/* Constraint Violations (Mocked) */}
                          {item.required && step.travelTime > 30 && (
                              <div className="text-xs text-red-600 mt-2 bg-red-50 p-1 rounded">Warning: Required item reached late.</div>
                          )}
                        </div>
                      )
                  })
                )}
              </div>
            </div>

            {/* RIGHT: Fatigue, Reservations, Tools */}
            <div className="w-1/4 bg-white p-4 rounded shadow overflow-y-auto flex flex-col gap-4">
               <div>
                   <h2 className="font-bold mb-2">Fatigue & Preferences</h2>
                   <div className="space-y-2">
                       {VISITORS.map(v => (
                           <div key={v.id} className="text-sm">
                               <div className="flex justify-between">
                                   <span>{v.name}</span>
                                   <span className="text-gray-500">{route.length * 5}% fatigue</span>
                               </div>
                               <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
                                   <div className={`h-full ${route.length > 10 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${Math.min(100, route.length * 5)}%`}}></div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>

               <div>
                   <h2 className="font-bold mb-2">Reservations</h2>
                   <div className="space-y-2">
                       {TIMED_WINDOWS.map(w => {
                           const ex = EXHIBITS.find(e => e.id === w.exhibitId);
                           const isReserved = reservations.find(r => r.windowId === w.id);
                           return (
                               <div key={w.id} className="p-2 border rounded text-sm bg-gray-50">
                                   <div className="font-medium">{ex.name}</div>
                                   <div className="text-gray-600">{formatTime(w.start)} - {formatTime(w.end)}</div>
                                   <button
                                      className={`mt-1 px-2 py-1 rounded text-xs ${isReserved ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                                      onClick={() => {
                                          if (isReserved) setReservations(reservations.filter(r => r.windowId !== w.id));
                                          else setReservations([...reservations, {id: Date.now(), windowId: w.id, state: 'confirmed'}]);
                                      }}
                                   >
                                       {isReserved ? 'Confirmed (Click to Cancel)' : 'Reserve'}
                                   </button>
                               </div>
                           )
                       })}
                   </div>
               </div>

               <div className="mt-auto">
                   <h2 className="font-bold mb-2">Tools & Rehearsal</h2>
                   <div className="flex flex-col gap-2">
                       <button onClick={() => setClock(c => c + 15)} className="px-3 py-2 bg-gray-200 rounded text-sm font-medium">Advance Clock (+15m)</button>
                       <button onClick={() => setRoute([...route, {id: 'split', name: 'Group Split', kind: 'split'}])} className="px-3 py-2 bg-purple-100 text-purple-800 rounded text-sm font-medium">Split Group</button>
                       <button onClick={() => setRoute([...route, {id: 'rejoin', name: 'Group Rejoin', kind: 'rejoin'}])} className="px-3 py-2 bg-purple-100 text-purple-800 rounded text-sm font-medium">Rejoin Group</button>
                       <button onClick={() => setRehearsalEvent(rehearsalEvent ? null : 'delay')} className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded text-sm font-medium">
                           {rehearsalEvent ? 'Clear Rehearsal' : 'Rehearse Delay'}
                       </button>
                   </div>

                   {rehearsalEvent && (
                      <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-900 rounded text-sm shadow">
                        <div className="font-bold mb-1">Delay Rehearsal Active!</div>
                        <div>Elevator closure on Floor 2. +12 mins delay.</div>
                        <button onClick={() => setRehearsalEvent(null)} className="mt-2 bg-white px-2 py-1 rounded shadow-sm text-xs border border-red-200 font-bold">Reroute / Repair</button>
                      </div>
                   )}
               </div>
            </div>

          </div>
        ) : (
          <div className="w-full bg-white p-6 rounded shadow flex flex-col h-full">
             <h2 className="font-bold text-xl mb-4">Export Artifacts</h2>
             <div className="flex gap-4 border-b pb-2 mb-4">
                <button className="font-medium text-blue-600 border-b-2 border-blue-600 pb-1">Session JSON</button>
                <button className="font-medium text-gray-500 pb-1">SVG Map</button>
                <button className="font-medium text-gray-500 pb-1">ICS</button>
                <button className="font-medium text-gray-500 pb-1">CSV</button>
             </div>
             <textarea
               readOnly
               className="flex-1 w-full p-4 font-mono text-sm bg-gray-50 border rounded resize-none"
               value={generateExportData()}
             />
             <div className="mt-4 flex gap-4">
                 <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold shadow hover:bg-blue-700">Download Artifact</button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
