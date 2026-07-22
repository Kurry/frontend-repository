import { TaskView } from './components/TaskView';
import { DependencyGraph } from './components/DependencyGraph';
import { PriorityAllocator } from './components/PriorityAllocator';
import { ClockDecay } from './components/ClockDecay';
import { TriageSession } from './components/TriageSession';
import { WipPlanner } from './components/WipPlanner';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      <header className="border-b pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Backlog Decay Observatory</h1>
        <p className="text-muted-foreground mt-1">Evidence-aware priority task manager</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-8">
          <TaskView />
          <DependencyGraph />
        </div>
        <div className="flex flex-col gap-8">
          <PriorityAllocator />
          <ClockDecay />
        </div>
      </div>

      <TriageSession />
      <WipPlanner />

    </div>
  );
}

export default App;
