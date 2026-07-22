import { ColorList } from './components/ColorList';
import { ScenarioWeaver } from './components/ScenarioWeaver';
import { SummaryPanel } from './components/SummaryPanel';

function App() {
  return (
    <div className="h-screen w-full flex flex-col bg-bg-base text-text-base font-sans overflow-hidden">
      <header className="h-14 border-b border-white/10 flex items-center px-6 shrink-0">
        <h1 className="text-white font-bold tracking-wide">Palette Harmony Matrix</h1>
      </header>

      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="h-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-[300px] h-[40vh] md:h-full">
            <ColorList />
          </div>

          <div className="flex-1 min-w-[300px] h-[40vh] md:h-full">
            <ScenarioWeaver />
          </div>

          <div className="w-full md:w-80 h-[20vh] md:h-full shrink-0">
            <SummaryPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
