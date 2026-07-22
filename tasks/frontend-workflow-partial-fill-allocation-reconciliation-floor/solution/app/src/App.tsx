import React, { useEffect } from 'react';
import { ImportDiagnostic } from './components/ImportDiagnostic';
import { AllocationFloor } from './components/AllocationFloor';
import { RuleGuard } from './components/RuleGuard';
import { ExecutionLedger } from './components/ExecutionLedger';
import { VarianceMatrix } from './components/VarianceMatrix';
import { ConservationRibbon } from './components/ConservationRibbon';
import { useAppStore } from './store/store';
import { exportBatchJSON, exportReconciliationCSV, exportExceptionCSV } from './utils/export';
import { setupWebMCP } from './utils/webmcp';

function App() {
  const { intents, fills } = useAppStore();

  useEffect(() => {
    setupWebMCP();
  }, []);

  const isImported = intents.length > 0 || fills.length > 0;

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-50">
      <header className="bg-white border-b p-4 flex justify-between items-center shrink-0">
        <h1 className="text-xl font-bold">Partial-Fill Allocation Reconciliation Floor</h1>
        {isImported && (
          <div className="flex gap-2">
            <button onClick={exportBatchJSON} className="border px-3 py-1 bg-gray-100">Export JSON</button>
            <button onClick={exportReconciliationCSV} className="border px-3 py-1 bg-gray-100">Export Recon CSV</button>
            <button onClick={exportExceptionCSV} className="border px-3 py-1 bg-gray-100">Export Exception CSV</button>
          </div>
        )}
      </header>

      {isImported && <ConservationRibbon />}

      <main className="flex-1 overflow-hidden">
        {!isImported ? (
          <ImportDiagnostic />
        ) : (
          <div className="flex flex-col h-full p-2 gap-2">
            <div className="flex-1 min-h-0">
              <AllocationFloor />
            </div>
            <div className="flex-none">
              <ExecutionLedger />
            </div>
            <div className="flex-none flex gap-2">
              <div className="w-1/2"><VarianceMatrix /></div>
              <div className="w-1/2"><RuleGuard /></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
