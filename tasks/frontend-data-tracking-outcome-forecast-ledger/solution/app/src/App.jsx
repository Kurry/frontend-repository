import React from 'react'
import { useStore } from './store.js'
import ForecastComposer from './components/ForecastComposer.jsx'
import Timeline from './components/Timeline.jsx'
import EvidenceGraph from './components/EvidenceGraph.jsx'
import Adjudication from './components/Adjudication.jsx'
import ScoreCalibration from './components/ScoreCalibration.jsx'
import ReviewWorkflow from './components/ReviewWorkflow.jsx'
import ExportPanel from './components/ExportPanel.jsx'

function App() {
  const { isLoaded } = useStore()

  if (!isLoaded) return <div>Loading fixtures...</div>

  return (
    <div className="min-h-screen p-4 flex flex-col md:flex-row gap-4">
      <div className="flex-1 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Outcome Forecast Ledger</h1>
        <ForecastComposer />
        <Timeline />
      </div>
      <div className="flex-1 flex flex-col gap-4">
        <EvidenceGraph />
        <Adjudication />
      </div>
      <div className="flex-1 flex flex-col gap-4">
        <ScoreCalibration />
        <ReviewWorkflow />
        <ExportPanel />
      </div>
    </div>
  )
}

export default App
