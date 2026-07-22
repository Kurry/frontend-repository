import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Plus, FileUp, FileDown, Activity, Calendar, FileJson, Clock } from 'lucide-react';
import { registerWebMCP } from './webmcp';

// Fixture setup
const generateFixture = () => {
  const measures = Array.from({ length: 64 }, (_, i) => ({
    id: i + 1,
    timeSignature: "4/4",
    beatCount: 4,
    section: i < 16 ? "A" : i < 32 ? "B" : i < 48 ? "C" : "D",
    phrase: Math.floor(i / 8) + 1,
    targetBPM: 120
  }));

  const takes = Array.from({ length: 12 }, (_, i) => ({
    id: `take-${i+1}`,
    events: [
        { measure: 5, beat: 1, type: "error", source: "drift" },
        { measure: 5, beat: 2.5, type: "note", source: "missed" }
    ]
  }));

  return { measures, takes };
};

const fixture = generateFixture();

export default function App() {
  const [loops, setLoops] = useState([{ id: 'loop-1', name: 'Phrase 1 start', start: 1, end: 8, reps: 5, rules: 'success' }]);
  const [selectedRange, setSelectedRange] = useState({ start: 1, end: 1 });
  const [activeLoop, setActiveLoop] = useState(null);

  // sessionState: idle, count-in, playing, self-mark, repeat, backoff, break, complete
  const [sessionState, setSessionState] = useState('idle');
  const [sessionTick, setSessionTick] = useState(0);
  const [currentBPM, setCurrentBPM] = useState(120);
  const [currentRep, setCurrentRep] = useState(1);
  const [takes, setTakes] = useState(fixture.takes);
  const [schedule, setSchedule] = useState([{ day: 3, loop: 'loop-1', status: 'due' }]);
  const [loopName, setLoopName] = useState('');
  const [loopReps, setLoopReps] = useState(5);
  const importRef = useRef(null);
  const stateRef = useRef(null);

  stateRef.current = { loops, selectedRange, sessionState, currentBPM, takes, schedule };

  useEffect(() => {
    registerWebMCP({
      state: () => stateRef.current,
      select: (type, objectId) => type === 'practice-loop' ? loops.some(loop => loop.id === objectId) : type === 'take-event' ? takes.some(take => take.events.some((_, index) => `${take.id}-event-${index}` === objectId)) : false,
      createLoop: values => { const loop = { id: `loop-${Date.now()}`, ...values }; setLoops(current => [...current, loop]); return loop; },
      deleteLoop: objectId => { const exists = loops.some(loop => loop.id === objectId); if (exists) setLoops(current => current.filter(loop => loop.id !== objectId)); return exists; },
      updateLoop: (objectId, property, value) => { const exists = loops.some(loop => loop.id === objectId); if (exists) setLoops(current => current.map(loop => loop.id === objectId ? { ...loop, [property]: value } : loop)); return exists; },
      setRange: setSelectedRange,
      showMode: mode => document.querySelector(`[data-workspace="${mode}"]`)?.scrollIntoView({ behavior: 'auto', block: 'center' }),
      toggleSchedule: (day, loopId) => { const existing = schedule.find(item => item.day === day && item.loop === loopId); const status = existing?.status === 'approved' ? 'due' : 'approved'; setSchedule(current => existing ? current.map(item => item === existing ? { ...item, status } : item) : [...current, { day, loop: loopId, status }]); return status; },
      start: () => { startSession(); return true; }, pause: pauseSession,
      resume: resumeSession, stop: () => { setSessionState('idle'); return true; }, restart: () => { startSession(); return true; },
      exportArtifact: handleExport, openImport: () => importRef.current?.click(),
      copyDossier: () => { const text = JSON.stringify(makeDossier()); navigator.clipboard?.writeText(text); return text.length; },
    });
  });

  const handleBrush = (m) => {
    setSelectedRange(prev => {
        if(prev.start === 1 && prev.end === 1) return {start: m.id, end: m.id};
        return { start: Math.min(prev.start, m.id), end: Math.max(prev.end, m.id) }
    });
  };

  const createLoop = () => {
      setLoops([...loops, {
          id: `loop-${Date.now()}`,
          name: loopName.trim() || `Loop ${selectedRange.start}-${selectedRange.end}`,
          start: selectedRange.start,
          end: selectedRange.end,
          reps: Number(loopReps),
          rules: 'standard'
      }]);
  };

  const startSession = () => {
      setSessionState('playing');
      setSessionTick(0);
      setCurrentRep(1);
  };
  const pauseSession = () => { if (stateRef.current.sessionState !== 'playing') return false; setSessionState('paused'); return true; };
  const resumeSession = () => { if (stateRef.current.sessionState !== 'paused') return false; setSessionState('playing'); return true; };

  const makeDossier = () => ({
          schemaVersion: "music-practice-dossier/v1",
          exportedAt: new Date().toISOString(),
          loops,
          sessionState,
          takes,
          schedule
      });

  const handleExport = (format = 'practice-dossier-json') => {
      const data = makeDossier();
      const variants = {
        'practice-dossier-json': { contents: JSON.stringify(data, null, 2), type: 'application/json', name: 'practice_dossier.json' },
        'practice-events-csv': { contents: `take,event,measure,beat,type\n${takes.flatMap(take => take.events.map((event, index) => `${take.id},${index},${event.measure},${event.beat},${event.type}`)).join('\n')}`, type: 'text/csv', name: 'practice_events.csv' },
        'score-overlay-svg': { contents: `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Practice score overlay"><text x="10" y="24">Measures ${selectedRange.start}-${selectedRange.end}</text></svg>`, type: 'image/svg+xml', name: 'score_overlay.svg' },
        'practice-schedule-ics': { contents: `BEGIN:VCALENDAR\nVERSION:2.0\n${schedule.map(item => `BEGIN:VEVENT\nUID:${item.loop}-day-${item.day}@practice-studio\nSUMMARY:Practice ${item.loop}\nDTSTART;VALUE=DATE:202601${String(item.day).padStart(2, '0')}\nEND:VEVENT`).join('\n')}\nEND:VCALENDAR`, type: 'text/calendar', name: 'practice_schedule.ics' },
        'practice-summary-md': { contents: `# Practice Summary\n\nLoops: ${loops.length}\nTakes: ${takes.length}\n`, type: 'text/markdown', name: 'practice_summary.md' },
      };
      const artifact = variants[typeof format === 'string' ? format : 'practice-dossier-json'] || variants['practice-dossier-json'];
      const blob = new Blob([artifact.contents], { type: artifact.type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = artifact.name;
      a.click();
  };

  const handleImport = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const data = JSON.parse(e.target.result);
                  if(data.schemaVersion === "music-practice-dossier/v1") {
                      setLoops(data.loops || []);
                      setTakes(data.takes || fixture.takes);
                      setSchedule(data.schedule || []);
                      setSessionState(data.sessionState || 'idle');
                  }
              } catch(err) {
                  console.error('Import failed', err);
              }
          };
          reader.readAsText(file);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Activity className="text-blue-600"/> Practice Loop Studio</h1>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded bg-white hover:bg-gray-50 cursor-pointer">
            <FileUp className="w-4 h-4" /> Import
            <input ref={importRef} type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
          <button onClick={() => handleExport()} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded bg-white hover:bg-gray-50">
            <FileDown className="w-4 h-4" /> Export
          </button>
          <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(makeDossier()))} className="px-3 py-1.5 text-sm border rounded bg-white hover:bg-gray-50">Copy JSON</button>
        </div>
      </header>

      <main className="flex-1 overflow-auto flex flex-col p-6 gap-6 max-w-7xl mx-auto w-full">
        {/* Score Range & Loop Editor */}
        <section data-workspace="score" className="bg-white p-6 rounded-lg shadow-sm border flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">Score Strip & Brush</h2>
          <div className="w-full overflow-x-auto border rounded bg-gray-50 p-4 min-h-[120px] flex items-center" tabIndex={0} onKeyDown={(e) => {
              if (e.key === 'ArrowRight') setSelectedRange(prev => ({...prev, end: Math.min(64, prev.end + 1)}));
              if (e.key === 'ArrowLeft') setSelectedRange(prev => ({...prev, start: Math.max(1, prev.start - 1)}));
          }}>
             <div className="flex gap-1 h-16 items-end select-none">
                {fixture.measures.map(m => {
                  const inRange = selectedRange.start <= m.id && selectedRange.end >= m.id;
                  const isLoop = loops.some(l => l.start <= m.id && l.end >= m.id);
                  return (
                    <div
                        key={m.id}
                        className={`w-6 border-l border-r border-t bg-white cursor-pointer relative transition-colors ${inRange ? 'bg-blue-100 border-blue-400' : isLoop ? 'bg-green-50' : 'border-gray-300'} ${m.id % 4 === 1 ? 'border-l-2' : ''}`}
                        style={{ height: m.id % 4 === 1 ? '100%' : '75%' }}
                        onPointerDown={() => setSelectedRange({start: m.id, end: m.id})}
                        onPointerEnter={(e) => e.buttons === 1 && setSelectedRange(prev => ({...prev, end: Math.max(prev.end, m.id)}))}
                    >
                        <span className="absolute -bottom-5 text-[10px] text-gray-400 font-mono w-full text-center">{m.id}</span>
                    </div>
                )})}
             </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">New Loop Name</label>
               <input type="text" value={loopName} onChange={event => setLoopName(event.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder={`Phrase ${selectedRange.start}-${selectedRange.end}`} />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Repetitions</label>
               <input type="number" min="1" max="100" className="w-24 border rounded px-3 py-2 text-sm" value={loopReps} onChange={event => setLoopReps(event.target.value)} />
            </div>
            <button onClick={createLoop} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Loop
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tempo Ramp Composer */}
          <section data-workspace="tempo" className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border flex flex-col gap-4">
             <h2 className="text-lg font-semibold">Tempo Curve Editor</h2>
             <div className="h-48 border rounded bg-gray-50 flex items-end p-4 relative group">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <path d="M 0 80 L 100 60 L 200 40 L 300 20 L 400 20" fill="none" stroke="#2563eb" strokeWidth="2" />
                  <circle cx="0" cy="80" r="6" fill="#2563eb" className="cursor-pointer hover:r-8 transition-all" />
                  <circle cx="100" cy="60" r="6" fill="#2563eb" className="cursor-pointer hover:r-8 transition-all" />
                  <circle cx="200" cy="40" r="6" fill="#2563eb" className="cursor-pointer hover:r-8 transition-all" />
                  <circle cx="300" cy="20" r="6" fill="#2563eb" className="cursor-pointer hover:r-8 transition-all" />
                  <circle cx="400" cy="20" r="6" fill="#2563eb" className="cursor-pointer hover:r-8 transition-all" />
                </svg>
             </div>
             <div className="grid grid-cols-5 gap-2 text-sm text-gray-600 text-center">
                <div className="font-mono bg-gray-100 p-2 rounded">Rep 1<br/>80 BPM</div>
                <div className="font-mono bg-gray-100 p-2 rounded">Rep 2<br/>90 BPM</div>
                <div className="font-mono bg-gray-100 p-2 rounded">Rep 3<br/>100 BPM</div>
                <div className="font-mono bg-gray-100 p-2 rounded">Rep 4<br/>120 BPM</div>
                <div className="font-mono bg-gray-100 p-2 rounded">Rep 5<br/>120 BPM</div>
             </div>
          </section>

          {/* Logical Session Runner */}
          <section className="bg-white p-6 rounded-lg shadow-sm border flex flex-col gap-4">
             <h2 className="text-lg font-semibold flex items-center justify-between">Session Runner <span className="text-xs px-2 py-1 bg-gray-100 rounded font-mono uppercase">{sessionState}</span></h2>
             <div className="flex-1 bg-gray-50 border rounded p-4 flex flex-col items-center justify-center gap-4 relative">

                {sessionState === 'playing' ? (
                    <>
                        <div className="text-5xl font-mono text-gray-800">{currentBPM} <span className="text-lg text-gray-500">BPM</span></div>
                        <div className="text-sm text-gray-500 uppercase tracking-widest font-bold">Repetition {currentRep} of 5</div>
                        <div className="flex gap-4 mt-4">
                            <button onClick={pauseSession} className="p-4 bg-red-100 text-red-600 rounded-full hover:bg-red-200 shadow-sm"><Pause className="w-8 h-8" fill="currentColor" /></button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-5xl font-mono text-gray-400">120 <span className="text-lg">BPM</span></div>
                        <div className="text-sm text-gray-400 uppercase tracking-widest font-bold">Ready</div>
                        <div className="flex gap-4 mt-4">
                            <button className="p-3 bg-gray-200 text-gray-500 rounded-full cursor-not-allowed"><RotateCcw className="w-6 h-6" /></button>
                            <button onClick={sessionState === 'paused' ? resumeSession : startSession} className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"><Play className="w-8 h-8" fill="currentColor" /></button>
                            <button className="p-3 bg-gray-200 text-gray-500 rounded-full cursor-not-allowed"><SkipForward className="w-6 h-6" /></button>
                        </div>
                    </>
                )}
             </div>
          </section>
        </div>

        {/* Take Comparison & Alignment */}
        <section data-workspace="takes" className="bg-white p-6 rounded-lg shadow-sm border flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex justify-between">
              Take Comparison & Event Alignment
              <span className="text-sm font-normal text-blue-600 hover:underline cursor-pointer">Accept Alignment</span>
          </h2>
          <div className="flex flex-col gap-4 relative">
             {takes.slice(0, 2).map((take, idx) => (
                 <div key={take.id} className="h-16 border rounded bg-gray-50 flex flex-col justify-end px-4 relative overflow-hidden group">
                     <span className="text-xs font-mono text-gray-500 absolute left-2 top-2 z-10">{take.id} {idx === 0 ? '(Ref)' : '(Drifted)'}</span>

                     <div className="absolute inset-0 flex">
                         {fixture.measures.slice(0, 16).map(m => (
                             <div key={m.id} className="flex-1 border-r border-gray-200 h-full"></div>
                         ))}
                     </div>

                     {take.events.map((ev, i) => (
                         <div
                            key={i}
                            className={`absolute w-3 h-3 rounded-full top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-20 ${ev.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'} shadow`}
                            style={{ left: `${(ev.measure / 16) * 100}%` }}
                            title={`Measure ${ev.measure} Beat ${ev.beat}`}
                         ></div>
                     ))}
                 </div>
             ))}

             <div className="absolute w-0.5 bg-blue-400 h-full left-1/4 top-0 z-0 opacity-50"></div>
          </div>
        </section>

        {/* Schedule & Performance Plan */}
        <section data-workspace="schedule" className="bg-white p-6 rounded-lg shadow-sm border flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-purple-600"/> 21-Day Schedule & Evaluator</h2>
          <div className="grid grid-cols-7 gap-2">
             {Array.from({length: 21}).map((_, i) => {
                const dayTasks = schedule.filter(s => s.day === i + 1);
                return (
                    <div key={i} className="aspect-square border rounded bg-gray-50 p-2 flex flex-col hover:border-purple-400 cursor-pointer transition-colors">
                    <span className="text-xs text-gray-400 font-medium mb-1">Day {i+1}</span>
                    {dayTasks.map((t, idx) => (
                        <div key={idx} className="mt-auto text-[10px] bg-red-100 text-red-700 px-1.5 py-1 rounded truncate border border-red-200">
                            Review {t.loop}
                        </div>
                    ))}
                    {i === 14 && <div className="mt-auto text-[10px] bg-purple-100 text-purple-700 px-1.5 py-1 rounded truncate border border-purple-200">Full Checkpoint</div>}
                    </div>
                )
             })}
          </div>
        </section>

      </main>
    </div>
  );
}
