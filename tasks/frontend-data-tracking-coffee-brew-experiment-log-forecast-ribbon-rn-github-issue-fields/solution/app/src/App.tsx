import { BrewList } from './components/BrewList';
import { ForecastRibbon } from './components/ForecastRibbon';
import { SessionManager } from './components/SessionManager';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-2 md:p-6 text-gray-800 flex flex-col">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Coffee Brew Experiment Log</h1>
        <p className="text-sm text-gray-500 mt-1">Domain-native observation & forecast tool</p>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 min-h-[600px]">
        {/* Main collection view */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col shadow-sm rounded-lg overflow-hidden border bg-white">
          <BrewList />
        </div>

        {/* Side panel */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4">
          <div className="flex-1 border shadow-sm rounded-lg overflow-hidden bg-white min-h-[350px]">
            <ForecastRibbon />
          </div>

          <div className="h-64 border shadow-sm rounded-lg overflow-hidden bg-white">
            <SessionManager />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
