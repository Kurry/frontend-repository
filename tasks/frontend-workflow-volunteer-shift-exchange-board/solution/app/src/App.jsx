import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import RosterCanvas from './components/RosterCanvas'
import TransactionComposer from './components/TransactionComposer'
import ResponseWorkflow from './components/ResponseWorkflow'
import ExportPanel from './components/ExportPanel'
import FairnessWaitlist from './components/FairnessWaitlist'

function App() {
  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center py-8">
      <h1 className="text-3xl font-bold text-gray-800 tracking-tight mb-8">Volunteer Shift Exchange Board</h1>
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl px-4">
        <div className="flex-1 space-y-6">
          <RosterCanvas />
          <FairnessWaitlist />
        </div>
        <div className="w-full lg:w-[400px] flex flex-col gap-6">
          <TransactionComposer />
          <ResponseWorkflow />
          <ExportPanel />
        </div>
      </div>
    </div>
  )
}

export default App
