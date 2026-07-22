import { useEffect, useState } from 'react';
import { usePacking } from './hooks/usePacking';
import { Header } from './components/Header';
import { PackingList } from './components/PackingList';
import { ScenarioWeaver } from './components/ScenarioWeaver';
import { setupWebMCP } from './webmcp';

function App() {
  const packingState = usePacking();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    setupWebMCP(packingState);
  }, [packingState]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        exportData={packingState.exportData}
        importData={packingState.importData}
        derived={packingState.derived}
        undo={packingState.undo}
        canUndo={packingState.canUndo}
      />
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col md:flex-row gap-4 p-4 max-w-7xl mx-auto">
          <div className="flex-1 flex flex-col min-h-0 bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
             <PackingList
                records={packingState.filteredRecords}
                filter={packingState.filter}
                setFilter={packingState.setFilter}
                updateRecord={packingState.updateRecord}
                deleteRecord={packingState.deleteRecord}
                addRecord={packingState.addRecord}
                selectedItemId={selectedItemId}
                setSelectedItemId={setSelectedItemId}
             />
          </div>
          <div className="w-full md:w-96 flex flex-col min-h-0 bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
            {selectedItemId ? (
              <ScenarioWeaver
                selectedItem={packingState.records.find(r => r.id === selectedItemId) || null}
                branchIntoScenario={packingState.branchIntoScenario}
                derived={packingState.derived}
                records={packingState.records}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 p-8 text-center">
                Select an item to view details and explore scenarios.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
