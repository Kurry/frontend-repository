import FlavorGrid from './FlavorGrid';
import BatchReconciler from './BatchReconciler';
import UndoControl from './UndoControl';
import SessionArtifactManager from './SessionArtifactManager';

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900">
      <header className="bg-indigo-900 text-white p-4 shadow-md flex flex-wrap justify-between items-center z-10 gap-2">
        <h1 className="text-xl font-bold">Recipe Flavor Balance Studio</h1>
        <div className="flex space-x-4 items-center">
          <UndoControl />
          <SessionArtifactManager />
        </div>
      </header>
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="flex-1 flex p-4 overflow-auto relative">
          <FlavorGrid />
        </div>
        <BatchReconciler />
      </main>
    </div>
  )
}
