import React from 'react';
import { EvidenceReader } from './EvidenceReader.jsx';
import { TaxonomyWorkbench } from './TaxonomyWorkbench.jsx';
import { Loom } from './Loom.jsx';
import { Visualizations } from './Visualizations.jsx';
import { MatrixRadar } from './MatrixRadar.jsx';
import { ConflictsAndExport } from './ConflictsAndExport.jsx';
import { WebMCPContract } from './WebMCPContract.jsx';

function App() {
  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col md:flex-row overflow-hidden font-sans">
      <WebMCPContract />

      {/* Sidebar: Reader */}
      <div className="w-full md:w-1/3 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-gray-300">
        <EvidenceReader />
      </div>

      {/* Main content: Loom, Matrix, Radar, Export */}
      <div className="flex-1 flex flex-col h-1/2 md:h-full bg-gray-50 overflow-y-auto">
        <header className="p-4 border-b bg-white flex justify-between items-center shrink-0 shadow-sm z-10 sticky top-0">
          <h1 className="text-2xl font-bold text-gray-800">Narrative Motif Arc Loom</h1>
        </header>

        <div className="flex-1 p-4 flex flex-col gap-8 pb-12 overflow-x-hidden">
          <TaxonomyWorkbench />
          <Loom />
          <Visualizations />
          <MatrixRadar />
          <ConflictsAndExport />
        </div>
      </div>
    </div>
  );
}

export default App;
