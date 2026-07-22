import React, { useState } from 'react';
import { PhotoSequenceList } from './components/PhotoSequenceList';
import { ForecastRibbon } from './components/ForecastRibbon';
import { SummaryPanel } from './components/SummaryPanel';

function App() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden text-gray-900">
      {/* Mobile-responsive layout transformations */}
      <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 transition-transform duration-300 ${selectedId ? 'hidden md:block' : 'block'}`}>
        <PhotoSequenceList selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      <div className={`flex-1 flex flex-col min-w-0 transition-transform duration-300 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
        {selectedId && (
          <div className="md:hidden p-4 border-b bg-white flex items-center">
            <button
              onClick={() => setSelectedId(null)}
              className="text-blue-600 font-medium text-sm"
            >
              &larr; Back to List
            </button>
          </div>
        )}
        <ForecastRibbon selectedId={selectedId} />
      </div>

      <SummaryPanel />
    </div>
  );
}

export default App;
