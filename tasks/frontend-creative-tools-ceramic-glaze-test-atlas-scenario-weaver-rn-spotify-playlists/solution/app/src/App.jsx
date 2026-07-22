import { useState, useEffect } from 'react';
import GlazeGrid from './GlazeGrid';
import ScenarioWeaver from './ScenarioWeaver';
import Summary from './Summary';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col md:flex-row gap-4">
        {/* Left Column: Grid */}
        <div className="flex-1 md:w-1/2 flex flex-col min-w-0">
            <GlazeGrid />
        </div>

        {/* Right Column: Weaver & Summary Stacked */}
        <div className="flex-1 md:w-1/2 flex flex-col gap-4 min-w-0 h-full max-h-screen">
            <div className="flex-1 min-h-0">
               <ScenarioWeaver />
            </div>
            <div className="h-[250px] shrink-0">
               <Summary />
            </div>
        </div>
    </div>
  )
}

export default App
