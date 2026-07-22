import React, { useEffect, useState } from 'react';
import { Play, Pause, Plus, XCircle, FileDown, CheckCircle, Clock, Users, ArrowRight } from 'lucide-react';
import { useStore } from './store';

function App() {
  const store = useStore();

  useEffect(() => {
    let interval;
    if (store.isClockRunning) {
      interval = setInterval(() => {
        store.tick();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [store.isClockRunning]);

  const handleExport = () => {
    const state = store.getLedgerState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'decision-minutes-ledger.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLatestAttendance = (userId) => {
      const userEvents = store.attendanceEvents.filter(e => e.userId === userId).sort((a,b) => b.timestamp - a.timestamp);
      return userEvents.length > 0 ? userEvents[0].isPresent : false;
  };

  const latestProposals = Object.values(
    store.proposals.reduce((acc, p) => {
        if (!acc[p.title] || p.revision > acc[p.title].revision) {
            acc[p.title] = p;
        }
        return acc;
    }, {})
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold">Decision Minutes Lineage Board</h1>
          <p className="text-slate-500">River Ward Committee</p>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
                <FileDown className="w-4 h-4" /> Export Ledger
            </button>
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <div className="text-2xl font-mono flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-400"/>
                    {Math.floor(store.logicalClock / 60).toString().padStart(2, '0')}:{(store.logicalClock % 60).toString().padStart(2, '0')}
                </div>
                <button onClick={() => store.isClockRunning ? store.pauseClock() : store.startClock()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    {store.isClockRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Agenda Column */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2"><Plus className="w-5 h-5"/> Agenda</h2>
          <div className="space-y-3">
            {store.agendaBlocks.map(item => (
              <div key={item.id} className={`p-4 rounded-lg border ${
                item.actualStart !== null && item.actualEnd === null ? 'bg-blue-50 border-blue-200 shadow-sm' :
                item.actualEnd !== null ? 'bg-slate-100 border-slate-200 opacity-75' :
                'bg-white border-slate-200 hover:shadow-md transition-shadow'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{item.title}</h3>
                  <span className="text-sm text-slate-500">{item.plannedEnd - item.plannedStart}m</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-500 font-mono">
                        {item.actualStart !== null ? `Started @ ${item.actualStart}` : 'Planned'}
                    </span>
                    {item.actualStart === null && (
                        <button onClick={() => store.startAgendaBlock(item.id)} className="text-xs text-blue-600 hover:underline">Start</button>
                    )}
                    {item.actualStart !== null && item.actualEnd === null && (
                        <button onClick={() => store.endAgendaBlock(item.id)} className="text-xs text-emerald-600 hover:underline">Complete</button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Proposals & Lineage */}
        <div className="space-y-4 col-span-2">
          <h2 className="text-xl font-semibold">Proposals & DAG Lineage</h2>
          <div className="space-y-4">
            {latestProposals.map(prop => (
              <div key={prop.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-lg">{prop.title}</h3>
                  <div className="flex gap-2">
                      <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">Rev {prop.revision}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        prop.status === 'adopted' ? 'bg-emerald-100 text-emerald-800' :
                        prop.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {prop.status}
                      </span>
                  </div>
                </div>
                <p className="text-sm text-slate-700 mb-4">{prop.text}</p>

                {prop.status === 'draft' && (
                    <button onClick={() => store.introduceProposal(prop.id)} className="text-sm text-indigo-600 font-medium hover:underline">Introduce Motion</button>
                )}

                {prop.status === 'introduced' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                        <button onClick={() => store.amendProposal(prop.id, { type: 'substitute', text: prop.text + ' (Amended)' })} className="text-xs bg-slate-100 px-3 py-1.5 rounded hover:bg-slate-200">Create Amendment</button>
                        <button onClick={() => store.makeDecision(prop.id, 'adopted')} className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded hover:bg-emerald-200">Vote to Adopt</button>
                        <button onClick={() => store.makeDecision(prop.id, 'rejected')} className="text-xs bg-red-100 text-red-800 px-3 py-1.5 rounded hover:bg-red-200">Vote to Reject</button>
                    </div>
                )}

                {/* Show pending amendments */}
                {store.amendments.filter(a => a.targetId === prop.id && a.status === 'pending').map(a => (
                    <div key={a.id} className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-amber-800">Pending Amendment (Sub)</span>
                            <button onClick={() => store.acceptAmendment(a.id)} className="text-xs bg-white border border-amber-300 px-2 py-1 rounded text-amber-700 hover:bg-amber-100">Accept</button>
                        </div>
                        <p className="mt-1 text-amber-900">{a.text}</p>
                    </div>
                ))}

              </div>
            ))}
          </div>
        </div>

        {/* Action Board & Quorum */}
        <div className="space-y-6">

          <div className="space-y-3">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Users className="w-5 h-5"/> Attendance & Quorum</h2>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  {store.participants.map(p => (
                      <div key={p.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                          <span className="text-sm font-medium">{p.name} <span className="text-xs font-normal text-slate-500">({p.role})</span></span>
                          <button
                            onClick={() => store.markAttendance(p.id, !getLatestAttendance(p.id))}
                            className={`text-xs px-2 py-1 rounded ${getLatestAttendance(p.id) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                          >
                              {getLatestAttendance(p.id) ? 'Present' : 'Absent'}
                          </button>
                      </div>
                  ))}
                  <div className="mt-4 pt-3 border-t border-slate-200 text-sm font-medium flex justify-between">
                      <span>Quorum Status:</span>
                      <span className={store.participants.filter(p => getLatestAttendance(p.id)).length >= 4 ? 'text-emerald-600' : 'text-red-600'}>
                          {store.participants.filter(p => getLatestAttendance(p.id)).length} / 7 (Need 4)
                      </span>
                  </div>
              </div>
          </div>

          <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Action Items</h2>
                <button
                  onClick={() => store.generateAction('New Action Task', 'u1', 'decision-id')}
                  className="text-xs bg-slate-200 px-2 py-1 rounded hover:bg-slate-300"
                >
                  + Add
                </button>
              </div>

            {store.actions.map(action => (
              <div key={action.id} className={`p-4 rounded-lg border ${
                action.superseded ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-sm leading-tight">{action.task}</h3>
                  {action.superseded && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">{store.participants.find(p=>p.id === action.owner)?.name || action.owner}</span>
                  <span className={`px-2 py-1 rounded ${
                    action.status === 'review_required' ? 'bg-red-100 text-red-700 font-medium' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {action.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
            {store.actions.length === 0 && (
                <div className="text-sm text-slate-500 italic p-4 text-center bg-slate-100 rounded border border-dashed border-slate-300">No actions generated yet.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
