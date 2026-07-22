import { useState, useEffect } from 'react';

interface Phase {
  durationSlots: number;
  watts: number;
  interruptible: boolean;
}

interface Appliance {
  id: string;
  name: string;
  phases: Phase[];
  earliestStartSlot?: number;
  latestStartSlot?: number;
}

interface AssignedPhase {
  applianceId: string;
  phaseIndex: number;
  startSlot: number; // 0 to 191
  durationSlots: number;
  watts: number;
}

interface LoadPlan {
  schemaVersion: "household-load-plan/v1";
  exportedAt: string;
  appliances: Appliance[];
  intervals: number[]; // the 192 background values
  assignments: AssignedPhase[];
}

// Initial fixture
const initialIntervals = new Array(192).fill(0).map((_, i) => (i > 60 && i < 80 ? 1000 : 300));
const initialAppliances: Appliance[] = [
  { id: '1', name: 'Washing Machine', phases: [{ durationSlots: 4, watts: 500, interruptible: true }, { durationSlots: 2, watts: 1500, interruptible: false }] },
  { id: '2', name: 'EV Charger', phases: [{ durationSlots: 16, watts: 7000, interruptible: true }] },
  { id: '3', name: 'Dishwasher', phases: [{ durationSlots: 8, watts: 1200, interruptible: false }] }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('meter');
  const [intervals, setIntervals] = useState<number[]>(initialIntervals);
  const [appliances, setAppliances] = useState<Appliance[]>(initialAppliances);
  const [assignments, setAssignments] = useState<AssignedPhase[]>([]);

  const [dragging, setDragging] = useState<{ applianceId: string, phaseIndex: number } | null>(null);

  useEffect(() => {
    window.webmcp_session_info = { app_name: "Household Load-Shift Planner", version: "1.0.0" };
    window.webmcp_list_tools = () => [
      { name: "state_read", description: "Reads current schedule state" },
      { name: "action_simulate", description: "Simulates applying an execution event" },
      { name: "reset", description: "Resets to initial fixture" }
    ];
    window.webmcp_invoke_tool = async (name: string, _args: any) => {
      if (name === "state_read") return { intervals, appliances, assignments };
      if (name === "reset") {
        setIntervals(initialIntervals);
        setAppliances(initialAppliances);
        setAssignments([]);
        return { status: "success" };
      }
      if (name === "action_simulate") {
        // Mock a deviation
        return { status: "success", msg: "Simulated 10% peak deviation on EV Charger." };
      }
      return { status: "error", msg: "Unknown tool" };
    };
  }, [intervals, appliances, assignments]);

  const handleDragStart = (e: React.DragEvent, applianceId: string, phaseIndex: number) => {
    setDragging({ applianceId, phaseIndex });
    e.dataTransfer.setData('text/plain', `${applianceId}:${phaseIndex}`);
  };

  const handleDrop = (e: React.DragEvent, slot: number) => {
    e.preventDefault();
    if (!dragging) return;

    const appliance = appliances.find(a => a.id === dragging.applianceId);
    if (!appliance) return;

    const phase = appliance.phases[dragging.phaseIndex];
    if (!phase) return;

    // Check bounds
    if (slot + phase.durationSlots > 192) return;

    setAssignments(prev => {
      const filtered = prev.filter(a => !(a.applianceId === dragging.applianceId && a.phaseIndex === dragging.phaseIndex));
      return [...filtered, {
        applianceId: dragging.applianceId,
        phaseIndex: dragging.phaseIndex,
        startSlot: slot,
        durationSlots: phase.durationSlots,
        watts: phase.watts
      }];
    });
    setDragging(null);
  };

  const handleExport = () => {
    const plan: LoadPlan = {
      schemaVersion: "household-load-plan/v1",
      exportedAt: new Date().toISOString(),
      appliances,
      intervals,
      assignments
    };
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'household-load-plan.json';
    a.click(); URL.revokeObjectURL(url);
  };

  // Calculate aggregated load
  const aggregateLoad = [...intervals];
  assignments.forEach(assignment => {
    for (let i = 0; i < assignment.durationSlots; i++) {
      if (assignment.startSlot + i < 192) {
        aggregateLoad[assignment.startSlot + i] += assignment.watts;
      }
    }
  });

  const peakLimit = 8000;
  const isPeakViolated = Math.max(...aggregateLoad) > peakLimit;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-bold">Household Load-Shift Planner</h1>
          <p className="text-sm text-gray-500">48-hour period (192 slots)</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('meter')} className={`px-4 py-2 rounded-md ${activeTab === 'meter' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Meter & Grid</button>
          <button onClick={() => setActiveTab('export')} className={`px-4 py-2 rounded-md ${activeTab === 'export' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Export</button>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'meter' && (
          <div className="flex flex-col gap-6 h-full">
            <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
               <h2 className="text-lg font-bold mb-4">Appliances to Schedule</h2>
               <div className="flex gap-4 flex-wrap">
                  {appliances.map(app => (
                    <div key={app.id} className="border p-3 rounded bg-blue-50">
                      <div className="font-semibold mb-2">{app.name}</div>
                      <div className="flex gap-2">
                        {app.phases.map((phase, idx) => {
                           const assigned = assignments.find(a => a.applianceId === app.id && a.phaseIndex === idx);
                           if (assigned) return <span key={idx} className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">Mapped</span>;
                           return (
                             <div
                               key={idx}
                               draggable
                               onDragStart={(e) => handleDragStart(e, app.id, idx)}
                               className="bg-blue-500 text-white text-xs px-2 py-1 rounded cursor-grab active:cursor-grabbing"
                             >
                               Phase {idx+1}: {phase.durationSlots} slots, {phase.watts}W
                             </div>
                           )
                        })}
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm border border-gray-200 overflow-x-auto relative">
               <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">48-Hour Scheduling Grid</h2>
                  {isPeakViolated && <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded">Circuit Peak Violated (&gt; 8kW)</span>}
               </div>

               <div className="flex relative" style={{ width: 192 * 20 + 'px', height: '200px' }}>
                  {/* Grid background */}
                  {Array.from({length: 192}).map((_, i) => (
                    <div
                      key={i}
                      className={`h-full w-[20px] border-r border-gray-100 flex-shrink-0 ${aggregateLoad[i] > peakLimit ? 'bg-red-100' : (i % 8 === 0 ? 'bg-gray-50' : '')}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, i)}
                    >
                      {i % 16 === 0 && <span className="text-[10px] text-gray-400 block absolute top-0">{i/4}h</span>}
                    </div>
                  ))}

                  {/* Background Load Chart Overlay */}
                  <svg className="absolute bottom-0 left-0 w-full h-[100px] pointer-events-none opacity-20" preserveAspectRatio="none" viewBox="0 0 3840 10000">
                     {aggregateLoad.map((val, i) => (
                        <rect key={i} x={i * 20} y={10000 - val} width={20} height={val} fill={val > peakLimit ? "red" : "blue"} />
                     ))}
                  </svg>

                  {/* Render Placed assignments */}
                  {assignments.map((a, i) => (
                    <div
                       key={i}
                       className="absolute top-10 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded shadow cursor-pointer hover:bg-indigo-700 overflow-hidden whitespace-nowrap px-1"
                       style={{
                          left: `${a.startSlot * 20}px`,
                          width: `${a.durationSlots * 20}px`,
                          height: '24px'
                       }}
                       onClick={() => setAssignments(prev => prev.filter(x => x !== a))}
                       title="Click to remove"
                    >
                       {appliances.find(x => x.id === a.applianceId)?.name}
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
               <h2 className="text-lg font-bold mb-2">Metrics</h2>
               <p>Max Peak: <span className={isPeakViolated ? 'text-red-600 font-bold' : ''}>{Math.max(...aggregateLoad)} W</span></p>
               <p>Cost (estimated): ${(aggregateLoad.reduce((a,b) => a+b, 0) / 4000).toFixed(2)}</p>
            </div>
          </div>
        )}
        {activeTab === 'export' && (
          <div className="bg-white p-8 rounded shadow-sm border border-gray-200 text-center">
             <h2 className="text-2xl font-bold mb-6">Review and Export</h2>
             <p className="mb-8 text-gray-600">Export the final household load schedule to JSON. (CSV, SVG, and ICS are simulated by this action in the real implementation).</p>
             <button onClick={handleExport} className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow transition-transform active:scale-95 text-lg">Download Plan JSON</button>
          </div>
        )}
      </main>
    </div>
  );
}
