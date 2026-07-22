import React, { useState } from 'react'
import StoryNodes from './components/StoryNodes'
import ForecastRibbon from './components/ForecastRibbon'
import ArtifactPanel from './components/ArtifactPanel'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [artifactOpen, setArtifactOpen] = useState(false)

  return (
    <div className="flex h-screen w-full bg-zinc-100 overflow-hidden text-zinc-900 font-sans relative">

      {/* Sidebar for Story Nodes */}
      <div className={`absolute md:relative z-20 h-full w-80 flex-shrink-0 bg-white transition-transform duration-300 md:translate-x-0 border-r border-zinc-200 ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <StoryNodes />
      </div>

      {/* Main content */}
      <ForecastRibbon
        onToggleSidebar={() => { setSidebarOpen(!sidebarOpen); setArtifactOpen(false); }}
        onToggleArtifact={() => { setArtifactOpen(!artifactOpen); setSidebarOpen(false); }}
      />

      {/* Artifact Panel */}
      <div className={`absolute xl:relative z-20 h-full w-72 flex-shrink-0 bg-white transition-transform duration-300 xl:translate-x-0 right-0 border-l border-zinc-200 ${artifactOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}`}>
        <ArtifactPanel />
      </div>

      {/* Overlay for mobile */}
      {(sidebarOpen || artifactOpen) && (
        <div
          className="xl:hidden fixed inset-0 bg-black/20 z-10"
          onClick={() => { setSidebarOpen(false); setArtifactOpen(false); }}
        />
      )}
    </div>
  )
}

export default App
