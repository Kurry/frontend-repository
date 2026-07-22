
import { RecipeIngredients } from './components/RecipeIngredients';
import { ScenarioWeaver } from './components/ScenarioWeaver';
import { PortableArtifact } from './components/PortableArtifact';
import './webmcp';

function App() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Recipe Substitution Sandbox</h1>
        <p className="text-slate-500">Scenario Weaver Workspace</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto h-[calc(100vh-140px)] min-h-[600px]">
        {/* Mobile: Stack layout, Desktop: Grid layout */}
        <div className="lg:col-span-4 h-full">
          <RecipeIngredients />
        </div>

        <div className="lg:col-span-5 h-full">
          <ScenarioWeaver />
        </div>

        <div className="lg:col-span-3 h-full">
          <PortableArtifact />
        </div>
      </main>
    </div>
  );
}

export default App;
