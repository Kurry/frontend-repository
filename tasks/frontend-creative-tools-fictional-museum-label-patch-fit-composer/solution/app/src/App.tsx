import { useEffect } from 'react';
import { useStore } from './store/index';
import { Reader } from './components/Reader';
import { PatchRail } from './components/PatchRail';
import { ProofPanel } from './components/ProofPanel';
import { PatchConfirmModal } from './components/DragDropContext';
import { RebaseModal } from './components/RebaseModal';
import { HistoryPanel } from './components/HistoryPanel';

function App() {
  const initialize = useStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white text-gray-900 font-sans">
      <header className="h-14 bg-gray-900 text-white flex items-center px-4 justify-between shrink-0">
        <h1 className="font-semibold tracking-wide">Fictional Museum Label Composer</h1>
        <div className="text-xs text-gray-400">Copper Moth Cabinet • LBL-07</div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col lg:flex-row min-w-0 border-r border-gray-200">
          <div className="flex-1 overflow-hidden min-w-0">
            <Reader />
          </div>
          <div className="hidden lg:block shrink-0 h-full">
            <PatchRail />
          </div>
        </div>

        <div className="w-full md:w-1/3 lg:w-[450px] shrink-0 h-full overflow-hidden flex flex-col">
          <div className="flex-1 overflow-hidden border-b border-gray-200">
            <ProofPanel />
          </div>
          <div className="h-1/3 bg-gray-50 overflow-hidden">
             <HistoryPanel />
          </div>
        </div>
      </div>

      <div className="h-48 shrink-0 border-t border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        Inspector (Sources, Glossary, Reviews) - To be implemented
      </div>

      <PatchConfirmModal />
      <RebaseModal />
    </div>
  );
}

export default App;
