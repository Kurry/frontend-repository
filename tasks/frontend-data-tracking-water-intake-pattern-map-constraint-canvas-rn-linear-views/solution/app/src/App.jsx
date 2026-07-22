import React, { useEffect } from 'react'
import IntakeEvents from './components/IntakeEvents'
import ConstraintCanvas from './components/ConstraintCanvas'
import Artifacts from './components/Artifacts'
import { undo } from './store'
import { Undo2 } from 'lucide-react'

function App() {

  // Undo hotkey
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Water Intake Pattern Map</h1>
            <p className="text-gray-600 text-sm mt-1">Manage intake events in a bounded local workflow</p>
          </div>
          <button
            onClick={undo}
            className="flex items-center gap-1 text-sm bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 transition"
            title="Undo last change (Cmd/Ctrl + Z)"
          >
            <Undo2 size={16} /> Undo
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Artifacts />
            <IntakeEvents />
          </div>
          <div className="lg:col-span-2">
            <ConstraintCanvas />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
