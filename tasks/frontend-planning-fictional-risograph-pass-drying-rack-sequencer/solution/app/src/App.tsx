import { Proof } from './components/Proof';
import { PassRibbon } from './components/PassRibbon';
import { RackRibbon } from './components/RackRibbon';
import { OverlapEvidence } from './components/OverlapEvidence';
import { HistoryReview } from './components/HistoryReview';

function App() {
  return (
    <div className="min-h-screen bg-white p-4 lg:p-8 font-sans text-gray-900">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Fictional Risograph Pass & Drying-Rack Sequencer</h1>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="col-span-1 lg:col-span-7 flex flex-col gap-8">
          <Proof />
          <RackRibbon />
          <OverlapEvidence />
        </div>
        <div className="col-span-1 lg:col-span-5 flex flex-col gap-8">
          <PassRibbon />
          <HistoryReview />
        </div>
      </main>
    </div>
  );
}

export default App;
