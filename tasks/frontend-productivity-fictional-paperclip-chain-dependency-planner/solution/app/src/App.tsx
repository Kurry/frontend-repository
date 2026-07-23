import { useEffect } from 'react';
import { useStore } from './store/useStore';
import DeskView from './components/DeskView';
import ScheduleRibbon from './components/ScheduleRibbon';
import DependencyMatrix from './components/DependencyMatrix';
import IssueGraph from './components/IssueGraph';
import RehearsalController from './components/RehearsalController';
import BranchCompare from './components/BranchCompare';
import CompactMobileView from './components/CompactMobileView';
import { initializeWebMCP } from './webmcp';

function App() {
  const plan = useStore(state => state.plan);

  useEffect(() => {
    (window as any).webmcp_session_info = {
      planId: plan.planId,
      revision: plan.revision
    };
    initializeWebMCP();
  }, [plan.planId, plan.revision]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
      <header className="h-14 border-b border-slate-200 bg-white flex items-center px-4 shrink-0 justify-between">
        <div>
          <h1 className="font-semibold text-sm">Fictional Paperclip Planner</h1>
          <div className="text-xs text-slate-500">Branch: {plan.branchId}</div>
        </div>
        <div className="flex gap-4 text-sm items-center">
          <div>Finish: {new Date(plan.schedule.finish || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          <div>Buffer: {plan.schedule.reviewBufferMinutes}m</div>
          <div>Issues: {plan.issues.length}</div>
          <label className="px-2 py-1 bg-slate-200 text-slate-800 rounded text-xs ml-4 cursor-pointer">
            Import ZIP
            <input type="file" accept=".zip" className="hidden" onChange={(e) => {
              if(e.target.files?.[0]) {
                import("./store/import")
                  .then(m => m.parseImportZip(e.target.files![0]))
                  .then(p => useStore.getState().setPlan(p))
                  .catch(err => alert("Import failed: " + err.message));
              }
            }} />
          </label>
          <button onClick={() => import('./utils/export').then(m => m.createExportZip(plan))} className="px-2 py-1 bg-slate-800 text-white rounded text-xs ml-2">Export ZIP</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden hidden md:flex">
        <section className="flex-1 border-r border-slate-200 relative overflow-auto bg-slate-100 flex flex-col">
          <div className="flex-1 overflow-auto relative">
            <DeskView />
          </div>
          <div className="h-48 border-t border-slate-200 bg-white flex overflow-hidden shrink-0">
            <div className="w-1/2 border-r border-slate-200 overflow-auto">
               <BranchCompare />
            </div>
            <div className="w-1/2 overflow-auto">
               <RehearsalController />
            </div>
          </div>
        </section>

        <aside className="w-[400px] flex flex-col shrink-0 bg-white">
          <div className="h-1/3 border-b border-slate-200 overflow-auto p-4">
            <ScheduleRibbon />
          </div>
          <div className="h-1/3 border-b border-slate-200 overflow-auto p-4">
            <DependencyMatrix />
          </div>
          <div className="h-1/3 overflow-auto p-4">
            <IssueGraph />
          </div>
        </aside>
      </main>

      <div className="flex-1 md:hidden overflow-hidden">
         <CompactMobileView />
      </div>
    </div>
  );
}

export default App;
