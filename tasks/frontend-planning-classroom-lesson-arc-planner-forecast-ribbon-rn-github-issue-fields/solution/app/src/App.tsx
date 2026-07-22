import React, { useState } from 'react';
import { useStore } from './store';
import LessonBlocks from './LessonBlocks';
import ForecastRibbon from './ForecastRibbon';
import ArtifactManager from './ArtifactManager';
import { BookOpen, Activity, Download, LayoutDashboard } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'collection' | 'forecast' | 'artifact'>('collection');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Sidebar / Navigation */}
      <nav className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex-shrink-0 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-1.5 rounded">
            <LayoutDashboard size={20} />
          </div>
          <h1 className="font-semibold text-lg leading-tight">Classroom Arc<br/><span className="text-sm font-normal text-slate-500">Lesson Planner</span></h1>
        </div>

        <div className="flex md:flex-col gap-1 p-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('collection')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'collection' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <BookOpen size={18} />
            <span className="whitespace-nowrap">Lesson Blocks</span>
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'forecast' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Activity size={18} />
            <span className="whitespace-nowrap">Forecast Ribbon</span>
          </button>
          <button
            onClick={() => setActiveTab('artifact')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'artifact' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Download size={18} />
            <span className="whitespace-nowrap">Session Artifact</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-130px)] md:h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-slate-50 relative p-4 md:p-8">
            <div className="max-w-5xl mx-auto h-full">
              {activeTab === 'collection' && <LessonBlocks />}
              {activeTab === 'forecast' && <ForecastRibbon />}
              {activeTab === 'artifact' && <ArtifactManager />}
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
