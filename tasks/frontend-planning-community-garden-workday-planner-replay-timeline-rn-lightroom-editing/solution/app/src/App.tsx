import React from 'react';
import { Header } from './components/Header';
import { WorkTasksList } from './components/WorkTasksList';
import { TaskForm } from './components/TaskForm';
import { ReplayTimeline } from './components/ReplayTimeline';
import { Summary } from './components/Summary';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 overflow-hidden">
        {/* Mobile: stack. Desktop: side-by-side grid */}
        <div className="h-full flex flex-col md:flex-row">

          {/* Left panel: Collection */}
          <div className="w-full md:w-1/3 lg:w-1/4 h-[50vh] md:h-full shrink-0">
            <WorkTasksList />
          </div>

          {/* Right panel: Editor and Timeline */}
          <div className="flex-1 h-full overflow-y-auto p-4 lg:p-6 flex flex-col gap-6">
            <Summary />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="xl:col-span-1">
                <TaskForm />
              </div>

              <div className="xl:col-span-1">
                <ReplayTimeline />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
