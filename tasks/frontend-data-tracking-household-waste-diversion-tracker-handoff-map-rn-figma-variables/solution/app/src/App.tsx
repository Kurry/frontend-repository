import { ArtifactManager } from './components/ArtifactManager';

import { Summary } from './components/Summary';
import { WasteEventsList } from './components/WasteEventsList';
import { HandoffMap } from './components/HandoffMap';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Household Waste Diversion Tracker</h1>
          <p className="text-gray-500">Manage waste events and connect to handoff owners</p>
        </header>

        <Summary />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <WasteEventsList />
          </div>
          <div className="space-y-6">
            <HandoffMap />
            <ArtifactManager />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
