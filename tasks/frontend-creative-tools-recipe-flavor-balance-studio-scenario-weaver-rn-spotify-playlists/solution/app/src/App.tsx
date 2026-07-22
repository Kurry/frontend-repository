import { FlavorList } from './components/FlavorList';
import { ScenarioWeaver } from './components/ScenarioWeaver';
import { SummaryPanel } from './components/SummaryPanel';
import { ArtifactActions } from './components/ArtifactActions';
import { FlaskConical } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-base flex flex-col h-screen overflow-hidden text-sm md:text-base">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-black/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-full text-black">
            <FlaskConical size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Recipe Flavor Balance Studio</h1>
        </div>
        <ArtifactActions />
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-hidden">
        {/* Desktop Layout: 3 columns (List, Main, Summary) */}
        {/* Mobile Layout: Stacked with responsive height */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-full">

          <div className="md:w-1/4 flex-shrink-0 h-[40vh] md:h-full">
            <FlavorList />
          </div>

          <div className="flex-1 h-[50vh] md:h-full min-w-0">
            <ScenarioWeaver />
          </div>

          <div className="md:w-1/4 flex-shrink-0 h-[30vh] md:h-full">
            <SummaryPanel />
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
