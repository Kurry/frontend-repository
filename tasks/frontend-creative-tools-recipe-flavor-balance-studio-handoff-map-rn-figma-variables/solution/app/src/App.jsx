import React from 'react'
import { FlavorCollection } from './components/FlavorCollection'
import { HandoffMap } from './components/HandoffMap'
import { ArtifactManager } from './components/ArtifactManager'

function App() {
  return (
    <div className="flex flex-col h-screen bg-gray-100 md:flex-row overflow-hidden">
      {/* Sidebar: Collection & Artifact Manager */}
      <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col border-r border-gray-200 h-1/2 md:h-full bg-white z-10 shadow-sm">
        <div className="flex-1 overflow-hidden">
           <FlavorCollection />
        </div>
        <ArtifactManager />
      </div>

      {/* Main Content: Handoff Map */}
      <div className="w-full md:w-2/3 lg:w-3/4 h-1/2 md:h-full">
        <HandoffMap />
      </div>
    </div>
  )
}

export default App
