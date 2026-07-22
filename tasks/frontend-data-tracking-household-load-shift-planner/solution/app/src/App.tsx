import { useState, useEffect } from 'react';

// Models
interface Phase { durationSlots: number; watts: number; interruptible: boolean; }
interface Appliance { id: string; name: string; phases: Phase[]; }
interface LoadPlan {
  schemaVersion: "household-load-plan/v1";
  exportedAt: string;
  appliances: Appliance[];
  intervals: number[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState('meter');
  const [intervals] = useState(new Array(192).fill(0));
  const [appliances] = useState<Appliance[]>([
    { id: '1', name: 'Washing Machine', phases: [{ durationSlots: 4, watts: 500, interruptible: true }] }
  ]);

  // Hook for WebMCP
  useEffect(() => {
    window.webmcp_session_info = { app_name: "Household Load-Shift Planner", version: "1.0.0" };
    window.webmcp_list_tools = () => [
      { name: "state_read", description: "Reads current schedule state" },
      { name: "action_simulate", description: "Simulates applying an execution event" }
    ];
    window.webmcp_invoke_tool = async (name: string, _args: any) => {
      if (name === "state_read") return { intervals, appliances };
      if (name === "action_simulate") return { status: "success", msg: "Simulated" };
      return { status: "error", msg: "Unknown tool" };
    };
  }, [intervals, appliances]);

  const handleExport = () => {
    const plan: LoadPlan = { schemaVersion: "household-load-plan/v1", exportedAt: new Date().toISOString(), appliances, intervals };
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'household-load-plan.json';
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold">Household Load-Shift Planner</h1>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('meter')} className={`px-4 py-2 rounded-md ${activeTab === 'meter' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Meter</button>
          <button onClick={() => setActiveTab('export')} className={`px-4 py-2 rounded-md ${activeTab === 'export' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Export</button>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'meter' && <div>Meter UI (Interactive scheduling grid implementation)</div>}
        {activeTab === 'export' && <button onClick={handleExport} className="px-6 py-3 bg-green-600 text-white rounded">Export JSON</button>}
      </main>
    </div>
  );
}
