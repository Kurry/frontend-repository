import { type Component, onMount } from 'solid-js';
import { LoomUI } from './LoomUI';
import { CapsuleEditor } from './CapsuleEditor';
import { DependencyGraph } from './DependencyGraph';
import { TokenRuler } from './TokenRuler';
import { LossLens } from './LossLens';
import { SessionPreview } from './SessionPreview';
import { ExportImport } from './ExportImport';
import { state, setState, type Event } from './store';

const App: Component = () => {
  onMount(() => {
    // Generate deterministic fixture data
    const fixtureEvents: Event[] = Array.from({ length: 72 }, (_, i) => ({
      id: `evt-${i}`,
      phase: (i % 9) + 1,
      text: `Raw event data for event ${i} in phase ${(i % 9) + 1}.`,
      tokens: 138, // Roughly 10000 / 72
      protected: i % 12 === 0, // 6 anchors
    }));
    setState('events', fixtureEvents);
  });

  return (
    <div class="h-screen w-full flex flex-col md:flex-row p-4 gap-4 bg-slate-900 text-slate-100">
      <div class="fixed bottom-2 right-2 text-xs text-slate-400" data-testid="webmcp-status">{state.lastAction}</div>
      <div class="flex-1 flex flex-col gap-4">
          <LoomUI />
          <CapsuleEditor />
      </div>
      <div class="flex-1 flex flex-col gap-4">
        <DependencyGraph />
        <SessionPreview />
      </div>
      <div class="w-full md:w-64 flex flex-col gap-4 overflow-auto">
        <TokenRuler />
        <LossLens />
        <ExportImport />
      </div>
    </div>
  );
};

export default App;
