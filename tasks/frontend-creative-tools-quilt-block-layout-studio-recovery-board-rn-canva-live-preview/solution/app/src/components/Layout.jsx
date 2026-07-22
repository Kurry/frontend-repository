import React from 'react';

export function Layout({ children, summary, inspector }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Quilt Block Layout Studio</h1>
      </header>
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Primary surface */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>

        {/* Secondary panels: summary & inspector */}
        <aside className="w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col h-[50vh] md:h-auto shrink-0 z-10 md:static fixed bottom-0 left-0 right-0 overflow-auto shadow-lg md:shadow-none">
           <div className="p-6 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Summary</h2>
              {summary}
           </div>
           <div className="p-6 flex-1 bg-slate-50/50">
             <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Inspector</h2>
             {inspector}
           </div>
        </aside>
      </main>
    </div>
  );
}
