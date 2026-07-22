import React from 'react';

export default function Layout({ header, sidebar, timeline, summary }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {header}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 overflow-y-auto shrink-0 flex flex-col">
          {sidebar}
        </aside>
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-100">
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {timeline}
            </section>
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              {summary}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
