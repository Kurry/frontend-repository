import { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { ConstraintCanvas } from './components/ConstraintCanvas';
import { Sidebar } from './components/Sidebar';
import { Activity } from 'lucide-react';

function App() {
  const { state, dispatch } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Expose WebMCP session info function globally
  useEffect(() => {
      if (typeof window !== 'undefined') {
        (window as any).webmcp_session_info = async () => ({
           task_id: "eval-intelligence/frontend-data-tracking-sleep-recovery-variance-lab-constraint-canvas-rn-linear-views",
           capabilities: ["entity-collection-v1", "artifact-transfer-v1"]
        });
        (window as any).__get_store_state = () => state;
        (window as any).__dispatch = dispatch;
      }
  }, [state, dispatch]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 shrink-0">
        <Activity className="text-blue-600" size={24} />
        <h1 className="text-xl font-bold tracking-tight">Sleep Recovery Variance Lab</h1>
      </header>

      <main className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto h-full">
             <ConstraintCanvas
                records={state.records}
                conflictId={state.conflictId}
                dispatch={dispatch}
                onSelect={setSelectedId}
             />
          </div>
        </div>

        <Sidebar
          state={state}
          dispatch={dispatch}
          selectedId={selectedId}
        />
      </main>
    </div>
  );
}

export default App;
