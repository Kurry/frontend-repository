import React from 'react'
import { RecipeIngredients } from './RecipeIngredients'
import { ProvenanceAtlas } from './ProvenanceAtlas'
import { ExportImport } from './ExportImport'
import { TestTubeDiagonal } from 'lucide-react'
import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shadow-sm">
            <TestTubeDiagonal className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 tracking-tight leading-none">Recipe Substitution</h1>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-0.5">Sandbox Environment</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6">
        <div className="max-w-[1400px] mx-auto h-full flex flex-col lg:flex-row gap-6">
          <div className="flex-1 h-full min-h-[400px]">
            <RecipeIngredients />
          </div>

          <div className="w-full lg:w-[400px] shrink-0 h-full flex flex-col gap-6">
            <div className="flex-[2] min-h-[300px]">
              <ProvenanceAtlas />
            </div>
            <div className="flex-1 min-h-[200px]">
              <ExportImport />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
