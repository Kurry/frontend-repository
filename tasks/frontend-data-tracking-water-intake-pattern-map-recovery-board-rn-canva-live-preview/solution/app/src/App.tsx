import { useEffect, useRef } from 'react'
import { StoreProvider, useStore } from './store'
import { IntakeEvents } from './components/IntakeEvents'
import { RecoveryBoard } from './components/RecoveryBoard'
import { ArtifactPanel } from './components/ArtifactPanel'
import { registerWebMCP } from './webmcp'

function AppContent() {
  const { state, dispatch } = useStore()
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    registerWebMCP(dispatch, () => stateRef.current)
  }, [dispatch])

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Water Intake Pattern Map</h1>
          <p className="text-gray-500 mt-2">Manage intake events through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            <IntakeEvents />
            <ArtifactPanel />
          </div>
          <div>
            <RecoveryBoard />
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  )
}

export default App
