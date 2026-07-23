import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'framer-motion';
import {
  Check, AlertTriangle, Play, RefreshCw, Download, Loader, X, Scissors,
  ArrowLeftRight, MoveHorizontal, Magnet, ChevronUp, ChevronDown, GitBranch,
  Command as CommandIcon, Mic, Sun, Moon, Settings, HelpCircle, Copy,
  Sparkles, Keyboard, Volume2, VolumeX, Clipboard, Undo2,
} from 'lucide-react';
import {
  useStore, Store, LaneType, LANES, AUTOMATION_LANES, Source, Instance, Chapter,
  ApprovalCat, APPROVAL_CATS, OUTPUT_KEYS, OUTPUT_LABELS, Mode, SnapMode,
  tokensOfSource, sampleMix, cutChecksum, episodeEnd, TIMELINE_SPAN,
  lerpAutomation, PUBLISH_DATE, Token,
} from './store';
import { runValidation } from './validator';
import { ARTIFACT_META, deriveEpisodeTokens } from './artifacts';

// ---------------------------------------------------------------------------
// formatting — one convention everywhere: positions as m:ss.mmm, raw spans in ms
// ---------------------------------------------------------------------------
const pad = (n: number, w: number) => String(n).padStart(w, '0');
export const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${pad(Math.floor((ms % 60000) / 1000), 2)}.${pad(Math.round(ms % 1000), 3)}`;

const LANE_COLOR: Record<string, string> = {
  dialogue: 'bg-blue-500', crosstalk: 'bg-indigo-500', music: 'bg-pink-500',
  ambient: 'bg-teal-500', marker: 'bg-yellow-500',
};
const LANE_HEX: Record<string, string> = {
  dialogue: '#3b82f6', crosstalk: '#6366f1', music: '#ec4899', ambient: '#14b8a6', marker: '#eab308',
};

const btn = 'inline-flex items-center justify-center gap-1.5 rounded font-medium transition-colors min-h-11 px-3 py-2 text-sm';
const btnGhost = `${btn} bg-[var(--panel2)] hover:bg-[var(--border)] text-[var(--text)]`;
const btnAccent = `${btn} bg-[var(--accent)] hover:brightness-110 text-white`;
const inputCls = 'bg-[var(--panel2)] border border-[var(--border)] rounded px-2 py-1.5 text-sm w-full min-h-11 text-[var(--text)]';
const panelCls = 'bg-[var(--panel)] border border-[var(--border)] rounded-lg';

const MODES: { id: Mode; label: string }[] = [
  { id: 'sources', label: 'Sources' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'transcript', label: 'Transcript' },
  { id: 'chapters', label: 'Chapters' },
  { id: 'mix', label: 'Mix' },
  { id: 'rights', label: 'Rights' },
  { id: 'branches', label: 'Branches' },
  { id: 'render', label: 'Render' },
  { id: 'export', label: 'Export' },
];

// ---------------------------------------------------------------------------

export default function App() {
  const store = useStore();
  const shouldReduceMotion = useReducedMotion();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardStep, setOnboardStep] = useState(0);
  const [showPalette, setShowPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const withLoading = (key: string, fn: () => void, delay = 600) => {
    setLoading(key);
    window.setTimeout(() => { fn(); setLoading(null); }, delay);
  };

  // global keyboard: palette, help, and full clip editing without pointer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setShowPalette(p => !p); return; }
      if (typing) return;
      if (e.key === '?') { setShowHelp(h => !h); return; }
      const s = useStore.getState();
      if (e.altKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        s.setMode(MODES[Number(e.key) - 1].id);
        return;
      }
      const id = s.selectedInstance;
      if (!id) return;
      const step = e.shiftKey ? 1000 : 10;
      switch (e.key) {
        case 'ArrowRight': e.preventDefault(); e.altKey ? s.rippleMove(id, step) : s.moveInstance(id, step); break;
        case 'ArrowLeft': e.preventDefault(); e.altKey ? s.rippleMove(id, -step) : s.moveInstance(id, -step); break;
        case '[': s.trimInstance(id, 'start', e.shiftKey ? -1000 : -10); break;
        case ']': s.trimInstance(id, 'end', e.shiftKey ? 1000 : 10); break;
        case '{': s.trimInstance(id, 'start', e.shiftKey ? 1000 : 10); break;
        case '}': s.trimInstance(id, 'end', e.shiftKey ? -1000 : -10); break;
        case 's': case 'S': s.splitInstance(id); break;
        case 'm': case 'M': s.toggleMuteInstance(id); break;
        case 'g': case 'G': s.gapClose(id); break;
        case 'Delete': case 'Backspace': s.deleteInstance(id); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // voice input (guarded — alternative input path)
  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { store.addToast('info', 'Voice input is not supported by this browser — the command palette (Ctrl+K) covers the same commands.'); return; }
    if (listening) { recognitionRef.current?.stop?.(); setListening(false); return; }
    try {
      const rec = new SR();
      rec.lang = 'en-US';
      rec.onresult = (ev: any) => {
        const text: string = ev.results?.[0]?.[0]?.transcript?.toLowerCase() ?? '';
        const s = useStore.getState();
        if (text.includes('render')) { s.setMode('render'); s.startRender(); }
        else if (text.includes('export')) { s.setMode('export'); s.generateExport(); }
        else if (text.includes('valid')) s.setMode('mix');
        else if (text.includes('timeline')) s.setMode('timeline');
        else s.addToast('info', `Heard "${text}" — try "render", "export", "validate", or "timeline".`);
        setListening(false);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
      store.addToast('info', 'Listening… say "render", "export", "validate", or "timeline".');
    } catch {
      store.addToast('info', 'Voice input could not start in this environment.');
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && String(over.id).startsWith('lane-')) {
      const lane = String(over.id).replace('lane-', '') as LaneType;
      store.insertInstance(String(active.id), lane);
    }
  };

  const mainMode: Mode = store.mode;

  return (
    <MotionConfig reducedMotion="user">
      <div className={`theme-${store.theme} accent-${store.accent}`}>
        <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)] font-sans md:h-screen md:overflow-hidden">

          {showOnboarding && (
            <Onboarding step={onboardStep} setStep={setOnboardStep} close={() => setShowOnboarding(false)} reduce={!!shouldReduceMotion} />
          )}
          {showPalette && <CommandPalette close={() => setShowPalette(false)} />}
          {showSettings && <SettingsModal close={() => setShowSettings(false)} />}
          {showHelp && <HelpModal close={() => setShowHelp(false)} />}
          {showCoach && <CutCoach close={() => setShowCoach(false)} />}
          {store.reorderPreview && <ReorderPreviewModal />}

          <Header
            onPalette={() => setShowPalette(true)}
            onVoice={toggleVoice}
            listening={listening}
            onSettings={() => setShowSettings(true)}
            onHelp={() => setShowHelp(true)}
            onCoach={() => setShowCoach(true)}
          />

          <DndContext onDragEnd={handleDragEnd}>
            <div className="flex flex-1 flex-col md:flex-row md:overflow-hidden">

              {/* Source bin — left rail on desktop, Sources tab on mobile */}
              <aside className={`w-full border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--panel)] md:flex md:w-[330px] md:shrink-0 md:flex-col ${mainMode === 'sources' ? 'flex flex-col' : 'hidden'}`}>
                <SourceBin />
              </aside>

              {/* Main column */}
              <main className="flex min-w-0 flex-1 flex-col">
                <nav aria-label="Workspace sections" className="flex gap-1.5 overflow-x-auto border-b border-[var(--border)] bg-[var(--panel)] p-2">
                  {MODES.map(m => (
                    <button
                      key={m.id}
                      onClick={() => store.setMode(m.id)}
                      aria-keyshortcuts={`Alt+${MODES.findIndex(mode => mode.id === m.id) + 1}`}
                      className={`${btn} shrink-0 ${mainMode === m.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--panel2)] hover:bg-[var(--border)]'} ${m.id === 'sources' ? 'md:hidden' : ''}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </nav>

                <div className="flex-1 space-y-4 overflow-y-auto p-3 md:p-4">
                  {(mainMode === 'timeline' || (mainMode === 'sources' && true)) && <TimelinePanel loading={loading} />}
                  {mainMode === 'transcript' && <TranscriptPanel />}
                  {mainMode === 'chapters' && <ChaptersPanel />}
                  {mainMode === 'mix' && <MixPanel />}
                  {mainMode === 'rights' && <RightsPanel />}
                  {mainMode === 'branches' && <BranchesPanel />}
                  {mainMode === 'render' && <RenderPanel loading={loading} withLoading={withLoading} />}
                  {mainMode === 'export' && <ExportPanel />}
                </div>
              </main>

              {/* Right rail: approval/render stepper, citations, inspector, history */}
              <aside className="hidden w-[340px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--panel)] md:flex">
                <div className="flex-1 space-y-5 overflow-y-auto p-4">
                  <ApprovalStepper loading={loading} withLoading={withLoading} vertical />
                  <CitationsSection />
                  {store.selectedInstance && <Inspector idPrefix="desktop" />}
                  <HistorySection />
                </div>
              </aside>

              {/* Mobile: approval/render stepper + chapters lineage below content */}
              <div className="space-y-5 border-t border-[var(--border)] bg-[var(--panel)] p-3 md:hidden">
                <ApprovalStepper loading={loading} withLoading={withLoading} vertical />
                <CitationsSection />
                <HistorySection />
              </div>
            </div>

            {/* Mobile bottom sheet for the selected clip */}
            {store.selectedInstance && (
              <div className="fixed inset-x-0 bottom-0 z-40 max-h-[62vh] overflow-y-auto rounded-t-xl border-t border-[var(--border)] bg-[var(--panel)] p-4 shadow-2xl md:hidden">
                <Inspector idPrefix="mobile" />
              </div>
            )}
          </DndContext>

          <Toasts />
        </div>
      </div>
    </MotionConfig>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header(props: { onPalette: () => void; onVoice: () => void; listening: boolean; onSettings: () => void; onHelp: () => void; onCoach: () => void }) {
  const store = useStore();
  const share = async () => {
    const data = { title: 'Side Street Signals Cut', text: `Review ${store.branch} at ${cutChecksum(store)}`, url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else await navigator.clipboard.writeText(`${data.title}: ${data.text} ${data.url}`);
      store.addToast('success', navigator.share ? 'Cut handoff opened in the system share sheet.' : 'Cut handoff copied to the clipboard.');
    } catch (error: any) {
      if (error?.name !== 'AbortError') store.addToast('error', 'Cut handoff could not be shared. Try Export instead.');
    }
  };
  return (
    <header className="flex flex-col gap-2 border-b border-[var(--border)] bg-[var(--panel)] px-3 py-3 md:flex-row md:items-center md:justify-between md:px-4">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold md:text-2xl">Side Street Signals — Episode Assembly</h1>
        <p className="truncate text-sm text-[var(--muted)] md:text-xs">
          S03E07 “Night Market Economies” · stories from the city after dark · branch{' '}
          <span className="rounded bg-[var(--panel2)] px-1.5 py-0.5 font-mono text-[var(--accent)]">{store.branch}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded border border-green-700 bg-green-950/50 px-2 py-1 text-[10px] font-bold text-green-200" title="The app shell is cached by a service worker and can reopen offline">Offline Ready</span>
        <button onClick={props.onCoach} className={btnGhost} title="Open the live cut-risk forecast"><Sparkles className="h-4 w-4" /> Cut Coach</button>
        <button onClick={share} className={btnGhost} title="Share this cut handoff with the system share sheet or clipboard"><Clipboard className="h-4 w-4" /> Share</button>
        <button onClick={props.onPalette} className={btnGhost} title="Command palette (Ctrl+K)"><CommandIcon className="h-4 w-4" /> Commands</button>
        <button onClick={props.onVoice} className={`${btnGhost} ${props.listening ? 'ring-2 ring-[var(--accent)]' : ''}`} title="Voice commands (alternative input)"><Mic className="h-4 w-4" /> Voice</button>
        <button onClick={() => store.setTheme(store.theme === 'dark' ? 'light' : 'dark')} className={btnGhost} title="Toggle color theme">
          {store.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Theme
        </button>
        <button onClick={props.onSettings} className={btnGhost} title="Workspace preferences"><Settings className="h-4 w-4" /> Prefs</button>
        <button onClick={props.onHelp} className={btnGhost} title="Keyboard shortcuts and help (press ?)"><HelpCircle className="h-4 w-4" /> Help</button>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Source bin
// ---------------------------------------------------------------------------

function SourceBin() {
  const store = useStore();
  const [sortAsc, setSortAsc] = useState(true);
  const sorted = useMemo(() => {
    const arr = [...store.sources].sort((a, b) => a.duration - b.duration);
    return sortAsc ? arr : arr.reverse();
  }, [store.sources, sortAsc]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-[var(--border)] p-3">
        <h2 className="text-base font-semibold md:text-sm">Source Bin</h2>
        <button onClick={() => setSortAsc(a => !a)} className={btnGhost} title="Sort sources by duration, ascending or descending">
          Sort: Duration {sortAsc ? '↑' : '↓'}
        </button>
      </div>
      {store.insertError && (
        <div role="alert" className="m-3 rounded border border-red-700 bg-red-950/60 p-2 text-sm text-red-200">
          {store.insertError}
        </div>
      )}
      <div className="max-h-[50vh] flex-1 space-y-3 overflow-y-auto p-3 md:max-h-none">
        {sorted.length === 0
          ? <div className="p-4 text-center text-sm italic text-[var(--muted)]">The source bin is empty.</div>
          : sorted.map(s => <SourceCard key={s.id} source={s} />)}
      </div>
    </>
  );
}

function SourceCard({ source }: { source: Source }) {
  const store = useStore();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: source.id });
  const range = store.sourceRanges[source.id] ?? { in: 0, out: Math.min(10000, source.duration) };
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : undefined;
  const forbidden = source.rightsState === 'forbidden';

  return (
    <div ref={setNodeRef} style={style} className={`${panelCls} p-3 ${forbidden ? 'border-red-800' : ''}`}>
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-bold">{source.name}</div>
          <div className="text-xs text-[var(--muted)]">{source.speaker} · {source.type} · {fmt(source.duration)}</div>
        </div>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${forbidden ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
          {source.rightsState}
        </span>
      </div>
      <div className="mb-1.5 truncate font-mono text-[10px] text-[var(--muted)]" title={`Immutable media hash ${source.mediaHash}`}>
        hash {source.mediaHash}
      </div>
      <div className="mb-2 text-xs italic text-[var(--muted)]">“{source.transcriptSnippet}”</div>
      <div className="mb-2 grid grid-cols-2 gap-x-2 gap-y-0.5 border-t border-[var(--border)] pt-1.5 text-[10px] text-[var(--muted)]">
        <div>Usage: {source.allowedUsage || '—'}</div>
        <div>Territory: {source.territory || '—'}</div>
        <div className={source.attribution ? '' : 'text-amber-400'}>Attribution: {source.attribution ? 'on file' : 'missing'}</div>
        <div>Expiry: publish + {source.expiryDaysAfterPublish} d</div>
      </div>
      <div className="flex items-end gap-1.5">
        <div className="min-w-0 flex-1">
          <label htmlFor={`in-${source.id}`} className="block text-[10px] text-[var(--muted)]">In (ms)</label>
          <input id={`in-${source.id}`} type="number" inputMode="numeric" min={0} max={source.duration - 10} step={10}
            value={range.in}
            onChange={e => store.setSourceRange(source.id, Number(e.target.value), range.out)}
            className={inputCls} />
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor={`out-${source.id}`} className="block text-[10px] text-[var(--muted)]">Out (ms)</label>
          <input id={`out-${source.id}`} type="number" inputMode="numeric" min={10} max={source.duration} step={10}
            value={range.out}
            onChange={e => store.setSourceRange(source.id, range.in, Number(e.target.value))}
            className={inputCls} />
        </div>
        <button onClick={() => store.insertInstance(source.id)} className={btnAccent} title={`Insert ${source.name} range into its ${source.type} lane — the source itself never changes`}>
          Insert
        </button>
        <button {...listeners} {...attributes} className={`${btnGhost} cursor-grab touch-none active:cursor-grabbing`} title="Drag this source onto a timeline lane">
          <MoveHorizontal className="h-4 w-4" />
          <span className="sr-only">Drag {source.name} to a lane</span>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

function TimelinePanel({ loading }: { loading: string | null }) {
  const store = useStore();
  const shouldReduceMotion = useReducedMotion();
  const [sweeping, setSweeping] = useState(false);

  return (
    <>
      <div className={`${panelCls} flex flex-wrap items-center gap-3 p-3`}>
        <div className="flex items-center gap-2">
          <Magnet className="h-4 w-4 text-[var(--accent)]" aria-hidden />
          <label htmlFor="snap-mode" className="text-sm font-medium">Snap</label>
          <select id="snap-mode" value={store.snapMode} onChange={e => store.setSnapMode(e.target.value as SnapMode)} className={`${inputCls} w-auto`}>
            <option value="ms10">10 ms grid</option>
            <option value="token">Token boundaries (400 ms)</option>
            <option value="chapter">Chapter markers</option>
          </select>
        </div>
        <button
          onClick={() => { setSweeping(true); window.setTimeout(() => setSweeping(false), shouldReduceMotion ? 50 : 4200); }}
          className={btnGhost} title="Sweep a playhead across the mini-map to preview the cut">
          <Play className="h-4 w-4" /> Preview Sweep
        </button>
        {store.showHints && (
          <p className="min-w-[220px] flex-1 text-xs text-[var(--muted)]">
            Every edit lands on integer milliseconds. Click a clip to open its editor; keyboard: arrows move, [ ] trim, S split, M mute, G gap-close, Delete removes.
            <button onClick={() => store.setShowHints(false)} className="ml-2 underline">Hide hints</button>
          </p>
        )}
      </div>

      <MiniMap sweeping={sweeping} reduce={!!shouldReduceMotion} />

      {LANES.map(lane => <LaneRow key={lane} lane={lane} />)}

      {store.instances.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
          The timeline is empty. Drag a source from the bin onto a lane, or use a source card’s Insert button.
        </div>
      )}
    </>
  );
}

function MiniMap({ sweeping, reduce }: { sweeping: boolean; reduce: boolean }) {
  const store = useStore();
  const W = 600, H = 64;
  return (
    <div className={`${panelCls} p-2`} aria-label="Timeline mini-map">
      <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
        <span>Mini-Map · 0:00.000 – {fmt(TIMELINE_SPAN)}</span>
        <span>Episode ends {fmt(episodeEnd(store.instances))}</span>
      </div>
      <div className="relative w-full overflow-hidden rounded bg-[var(--panel2)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-16 w-full" role="img" aria-label="Overview of all timeline lanes">
          {LANES.map((lane, li) =>
            store.instances.filter(i => i.lane === lane).map(i => (
              <rect key={i.id}
                x={(i.start / TIMELINE_SPAN) * W} y={li * (H / 5) + 1}
                width={Math.max(2, ((i.end - i.start) / TIMELINE_SPAN) * W)} height={H / 5 - 2}
                rx={1.5} fill={LANE_HEX[lane]} opacity={i.mute ? 0.3 : 0.9} />
            )))}
          {store.chapters.map(c => (
            <line key={c.id} x1={(c.start / TIMELINE_SPAN) * W} y1={0} x2={(c.start / TIMELINE_SPAN) * W} y2={H} stroke="var(--muted)" strokeDasharray="2 3" strokeWidth={0.75} />
          ))}
        </svg>
        <AnimatePresence>
          {sweeping && (
            <motion.div
              className="absolute inset-y-0 w-0.5 bg-[var(--accent)]"
              initial={{ left: '0%' }}
              animate={{ left: '100%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 4, ease: 'linear' }}
              aria-hidden
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LaneRow({ lane }: { lane: LaneType }) {
  const store = useStore();
  const { isOver, setNodeRef } = useDroppable({ id: `lane-${lane}` });
  const instances = store.instances.filter(i => i.lane === lane);
  const flags = store.laneFlags[lane];

  return (
    <div className="mb-1">
      <div className="mb-1 flex items-center gap-2">
        <span className="w-24 text-sm font-bold md:text-xs" style={{ color: LANE_HEX[lane] }}>{lane[0].toUpperCase() + lane.slice(1)}</span>
        <button onClick={() => store.setLaneFlag(lane, 'mute')}
          aria-pressed={flags.mute}
          className={`${btnGhost} ${flags.mute ? 'bg-red-900 text-red-100' : ''}`}
          title={`Mute the ${lane} lane (silences it in the sampled mix)`}>
          {flags.mute ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />} Mute
        </button>
        <button onClick={() => store.setLaneFlag(lane, 'solo')}
          aria-pressed={flags.solo}
          className={`${btnGhost} ${flags.solo ? 'bg-amber-800 text-amber-100' : ''}`}
          title={`Solo the ${lane} lane (mutes every other lane in the sampled mix)`}>
          Solo
        </button>
        {flags.mute && <span className="text-xs text-red-400">muted</span>}
        {flags.solo && <span className="text-xs text-amber-400">solo</span>}
      </div>
      <div ref={setNodeRef}
        className={`relative flex h-24 overflow-x-auto rounded-lg border-2 transition-colors ${isOver ? 'border-[var(--accent)] bg-[var(--panel2)]' : 'border-[var(--border)] bg-[var(--panel)]'}`}>
        <div className="pointer-events-none absolute inset-0" style={{ backgroundSize: '10% 100%', backgroundImage: 'linear-gradient(to right, var(--border) 1px, transparent 1px)', minWidth: '900px' }} aria-hidden />
        {instances.map(inst => <ClipBlock key={inst.id} inst={inst} />)}
        {instances.length === 0 && (
          <span className="m-auto text-xs italic text-[var(--muted)]">Empty lane — drop a {lane === 'marker' ? 'marker or any clip' : `${lane} clip`} here.</span>
        )}
      </div>
    </div>
  );
}

function ClipBlock({ inst }: { inst: Instance }) {
  const store = useStore();
  const shouldReduceMotion = useReducedMotion();
  const src = store.sources.find(s => s.id === inst.sourceId);
  const selected = store.selectedInstance === inst.id;
  const sibling = !selected && !!store.selectedInstance &&
    store.instances.find(i => i.id === store.selectedInstance)?.sourceId === inst.sourceId;
  const fadePct = (f: number) => Math.min(48, ((f / Math.max(1, inst.end - inst.start)) * 100));

  return (
    <motion.div
      layout
      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
      initial={false}
      className={`absolute top-1 bottom-1 ${LANE_COLOR[inst.lane]} group rounded shadow-sm ${inst.mute ? 'opacity-40' : ''} ${selected ? 'z-20 ring-2 ring-white' : sibling ? 'z-10 ring-2 ring-amber-400' : 'z-10'}`}
      style={{ left: `${(inst.start / TIMELINE_SPAN) * 100}%`, width: `${((inst.end - inst.start) / TIMELINE_SPAN) * 100}%`, minWidth: '110px' }}
    >
      {/* fade wedges */}
      {inst.fadeIn > 0 && <div className="pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-black/50 to-transparent" style={{ width: `${fadePct(inst.fadeIn)}%` }} aria-hidden />}
      {inst.fadeOut > 0 && <div className="pointer-events-none absolute inset-y-0 right-0 bg-gradient-to-l from-black/50 to-transparent" style={{ width: `${fadePct(inst.fadeOut)}%` }} aria-hidden />}

      <button
        onClick={() => store.selectInstance(selected ? null : inst.id)}
        className="absolute inset-0 w-full rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        title={`Select ${src?.name ?? inst.id} (${fmt(inst.start)} – ${fmt(inst.end)})`}
      >
        <span className="block truncate px-2 pt-1 text-xs font-bold text-white drop-shadow">{src?.name ?? inst.id}{inst.mute ? ' · muted' : ''}{inst.crossfade ? ' · xfade' : ''}</span>
        <span className="block px-2 text-[10px] text-white/85">{fmt(inst.start)} – {fmt(inst.end)}</span>
      </button>

      <div className={`absolute right-1 top-1 z-10 flex gap-1 ${selected ? '' : 'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'}`}>
        <button
          onClick={() => store.deleteInstance(inst.id)}
          className="min-h-11 min-w-11 rounded bg-white/95 px-1.5 text-[11px] font-bold text-gray-900 shadow hover:bg-red-200"
          title="Remove this clip from the timeline (undo available afterwards)"
        >
          Remove
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Inspector (selected clip) — provenance + full edit surface
// ---------------------------------------------------------------------------

function Waveform({ source, from, to }: { source: Source; from: number; to: number }) {
  const bars = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < 48; i++) {
      const c = source.mediaHash.charCodeAt(i % source.mediaHash.length);
      out.push(4 + ((c * (i + 3)) % 20));
    }
    return out;
  }, [source.mediaHash]);
  const W = 192, H = 28;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-8 w-full rounded bg-[var(--panel2)]" role="img" aria-label={`Deterministic waveform for ${source.name} with the used range highlighted`}>
      <rect x={(from / source.duration) * W} y={0} width={Math.max(2, ((to - from) / source.duration) * W)} height={H} fill="var(--accent)" opacity={0.25} />
      {bars.map((b, i) => (
        <rect key={i} x={i * 4 + 1} y={(H - b) / 2} width={2} height={b} rx={1} fill={LANE_HEX[source.type] ?? 'var(--muted)'} />
      ))}
    </svg>
  );
}

function NumField({ id, label, value, onCommit, step = 10, min = 0 }: { id: string; label: string; value: number; onCommit: (v: number) => void; step?: number; min?: number }) {
  const [v, setV] = useState(String(value));
  useEffect(() => { setV(String(value)); }, [value]);
  return (
    <div>
      <label htmlFor={id} className="block text-[10px] text-[var(--muted)]">{label}</label>
      <input id={id} type="number" inputMode="numeric" step={step} min={min} value={v}
        onChange={e => setV(e.target.value)}
        onBlur={() => onCommit(Number(v))}
        onKeyDown={e => { if (e.key === 'Enter') onCommit(Number(v)); }}
        className={inputCls} />
    </div>
  );
}

function Inspector({ idPrefix = 'inspector' }: { idPrefix?: string }) {
  const store = useStore();
  const inst = store.instances.find(i => i.id === store.selectedInstance);
  const src = inst && store.sources.find(s => s.id === inst.sourceId);
  if (!inst || !src) return null;
  const siblings = store.instances.filter(i => i.sourceId === inst.sourceId && i.id !== inst.id);
  const toks = tokensOfSource(src.id).filter(t => t.start >= inst.sourceStart && t.end <= inst.sourceEnd);

  return (
    <section aria-label="Selected clip editor">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold md:text-sm">Selected Clip</h3>
        <button onClick={() => store.selectInstance(null)} className={btnGhost} title="Close the clip editor"><X className="h-4 w-4" /> Close</button>
      </div>
      <div className={`${panelCls} space-y-3 p-3 text-xs`}>
        <div>
          <div className="text-sm font-bold">{src.name} <span className="font-normal text-[var(--muted)]">on {inst.lane}</span></div>
          <div className="font-mono text-[10px] text-[var(--muted)]" title="The media hash never changes — timeline edits touch only this instance">
            source hash {src.mediaHash} · immutable
          </div>
        </div>

        <Waveform source={src} from={inst.sourceStart} to={inst.sourceEnd} />

        <div className="grid grid-cols-2 gap-2">
          <NumField id={`${idPrefix}-f-start`} label="Episode start (ms)" value={inst.start} onCommit={v => store.updateInstance(inst.id, { start: v, end: v + (inst.end - inst.start) }, 'move')} />
          <NumField id={`${idPrefix}-f-end`} label="Episode end (ms)" value={inst.end} onCommit={v => store.updateInstance(inst.id, { end: v }, 'trim-end')} />
          <NumField id={`${idPrefix}-f-sin`} label="Source in (ms)" value={inst.sourceStart} onCommit={v => store.updateInstance(inst.id, { sourceStart: v }, 'trim-start')} />
          <NumField id={`${idPrefix}-f-sout`} label="Source out (ms)" value={inst.sourceEnd} onCommit={v => store.updateInstance(inst.id, { sourceEnd: v }, 'trim-end')} />
          <NumField id={`${idPrefix}-f-gain`} label="Clip gain (dB)" value={inst.gain} step={1} min={-24} onCommit={v => store.updateInstance(inst.id, { gain: Math.max(-24, Math.min(12, v)) }, 'gain')} />
          <NumField id={`${idPrefix}-f-fin`} label="Fade in (ms)" value={inst.fadeIn} onCommit={v => store.updateInstance(inst.id, { fadeIn: v }, 'fade')} />
          <NumField id={`${idPrefix}-f-fout`} label="Fade out (ms)" value={inst.fadeOut} onCommit={v => store.updateInstance(inst.id, { fadeOut: v }, 'fade')} />
          <div>
            <span className="block text-[10px] text-[var(--muted)]">Lane</span>
            <select aria-label="Move clip to another lane" value={inst.lane} onChange={e => store.updateInstance(inst.id, { lane: e.target.value as LaneType }, 'lane-change')} className={inputCls}>
              {LANES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => store.trimInstance(inst.id, 'start', -10)} className={btnGhost} title="Trim the clip head 10 ms earlier">⊢ −10 ms</button>
          <button onClick={() => store.trimInstance(inst.id, 'start', 10)} className={btnGhost} title="Trim the clip head 10 ms later">⊢ +10 ms</button>
          <button onClick={() => store.trimInstance(inst.id, 'end', -10)} className={btnGhost} title="Trim the clip tail 10 ms earlier">⊣ −10 ms</button>
          <button onClick={() => store.trimInstance(inst.id, 'end', 10)} className={btnGhost} title="Trim the clip tail 10 ms later">⊣ +10 ms</button>
          <button onClick={() => store.splitInstance(inst.id)} className={btnGhost} title="Split this clip at its midpoint (snapped)"><Scissors className="h-4 w-4" /> Split</button>
          <button onClick={() => store.moveInstance(inst.id, -1000)} className={btnGhost} title="Move only this clip 1 s left (non-ripple)">← Move 1 s</button>
          <button onClick={() => store.moveInstance(inst.id, 1000)} className={btnGhost} title="Move only this clip 1 s right (non-ripple)">Move 1 s →</button>
          <button onClick={() => store.rippleMove(inst.id, 1000)} className={btnGhost} title="Ripple: shift this clip and everything after it 1 s right — source times stay put"><ArrowLeftRight className="h-4 w-4" /> Ripple +1 s</button>
          <button onClick={() => store.rippleMove(inst.id, -1000)} className={btnGhost} title="Ripple: shift this clip and everything after it 1 s left — source times stay put"><ArrowLeftRight className="h-4 w-4" /> Ripple −1 s</button>
          <button onClick={() => store.gapClose(inst.id)} className={btnGhost} title="Close the silent gap before this clip">Gap Close</button>
          <button onClick={() => store.toggleMuteInstance(inst.id)} className={`${btnGhost} ${inst.mute ? 'bg-red-900 text-red-100' : ''}`} aria-pressed={inst.mute} title="Mute or unmute just this clip">
            {inst.mute ? 'Unmute' : 'Mute'}
          </button>
          <button onClick={() => store.updateInstance(inst.id, { crossfade: !inst.crossfade }, 'crossfade')} className={`${btnGhost} ${inst.crossfade ? 'bg-[var(--accent)] text-white' : ''}`} aria-pressed={inst.crossfade} title="Declare a crossfade into the next clip on this lane (validated against clip bounds)">
            Crossfade
          </button>
          <button onClick={() => store.deleteInstance(inst.id)} className={`${btn} bg-red-800 text-red-100 hover:bg-red-700`} title="Remove this clip (undo offered afterwards)">Remove Clip</button>
        </div>

        {toks.length > 0 && (
          <div>
            <div className="mb-1 font-semibold">Transcript Tokens In Range ({toks.length})</div>
            <p className="line-clamp-2 text-[var(--muted)]">
              {toks.map(t => store.tokenState[t.id]?.correction?.text ?? t.text).join(' ')}
            </p>
            <button onClick={() => store.setMode('transcript')} className={`${btnGhost} mt-1.5`} title="Open the transcript editor for this clip">Edit Tokens</button>
          </div>
        )}

        <div>
          <div className="mb-1 font-semibold">Rights Record</div>
          <p className="text-[var(--muted)]">{src.rightsState} · {src.allowedUsage || 'usage missing'} · {src.territory || 'territory missing'} · {src.attribution ? 'attribution on file' : 'attribution missing'} · expires publish + {src.expiryDaysAfterPublish} d</p>
        </div>

        <div>
          <div className="mb-1 font-semibold">Other Instances Of This Source ({siblings.length})</div>
          {siblings.length === 0
            ? <p className="text-[var(--muted)]">No other instance uses {src.name}; siblings highlight in amber on the board.</p>
            : siblings.map(s2 => (
              <button key={s2.id} onClick={() => store.selectInstance(s2.id)} className={`${btnGhost} mb-1 mr-1`} title="Select this sibling instance">
                {s2.lane} · {fmt(s2.start)}
              </button>
            ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Transcript panel
// ---------------------------------------------------------------------------

function TranscriptPanel() {
  const store = useStore();
  const dlgInstances = store.instances.filter(i => i.lane === 'dialogue' || i.lane === 'crosstalk');
  const inst = store.instances.find(i => i.id === store.selectedInstance && (i.lane === 'dialogue' || i.lane === 'crosstalk')) ?? dlgInstances[0];
  const [correcting, setCorrecting] = useState<string | null>(null);
  const [corrText, setCorrText] = useState('');
  const [corrNote, setCorrNote] = useState('');
  if (!inst) {
    return <div className={`${panelCls} p-6 text-center text-sm text-[var(--muted)]`}>No dialogue instance on the timeline yet — insert a dialogue clip to derive its transcript tokens.</div>;
  }
  const src = store.sources.find(s => s.id === inst.sourceId)!;
  const toks = tokensOfSource(src.id).filter(t => t.start >= inst.sourceStart && t.end <= inst.sourceEnd);
  const sel = store.tokenSel;

  const onTokenClick = (t: Token, shift: boolean) => {
    if (shift && sel && sel.sourceId === src.id) {
      store.setTokenSel({ sourceId: src.id, fromIdx: Math.min(sel.fromIdx, t.idx), toIdx: Math.max(sel.fromIdx, t.idx) });
    } else {
      store.setTokenSel({ sourceId: src.id, fromIdx: t.idx, toIdx: t.idx });
    }
  };

  return (
    <div className="space-y-4">
      <div className={`${panelCls} p-4`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold md:text-sm">Transcript Tokens — {src.name}</h3>
          <div className="flex items-center gap-2">
            <label htmlFor="transcript-inst" className="text-xs text-[var(--muted)]">Instance</label>
            <select id="transcript-inst" value={inst.id} onChange={e => store.selectInstance(e.target.value)} className={`${inputCls} w-auto`}>
              {dlgInstances.map(i => <option key={i.id} value={i.id}>{store.sources.find(s => s.id === i.sourceId)?.name} @ {fmt(i.start)}</option>)}
            </select>
          </div>
        </div>
        {store.showHints && (
          <p className="mb-3 text-xs text-[var(--muted)]">
            Tokens are derived from the source range {inst.sourceStart}–{inst.sourceEnd} ms. Click a token to start a span, shift-click to extend it, then bind the span to a show-note citation. The strike toggle excludes a token from captions.
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {toks.map(t => {
            const st = store.tokenState[t.id];
            const inSel = sel && sel.sourceId === src.id && t.idx >= sel.fromIdx && t.idx <= sel.toIdx;
            const text = st?.correction?.text ?? t.text;
            const fixture = t.text === 'evning' && !st?.correction;
            return (
              <span key={t.id} className={`inline-flex items-center overflow-hidden rounded border text-sm ${inSel ? 'border-[var(--accent)] bg-[var(--accent)]/20' : 'border-[var(--border)] bg-[var(--panel2)]'} ${fixture ? 'border-amber-500' : ''}`}>
                <button
                  onClick={e => onTokenClick(t, e.shiftKey)}
                  className={`min-h-11 px-2 ${st?.included === false ? 'line-through opacity-50' : ''}`}
                  title={st?.correction
                    ? `Corrected from “${t.text}” by ${st.correction.by} (rev ${st.correction.rev}): ${st.correction.note}`
                    : fixture ? 'Known fixture error — correct it with provenance' : `Token ${t.start}–${t.end} ms`}
                >
                  {text}{st?.correction ? '✱' : ''}
                </button>
                <button
                  onClick={() => store.toggleToken(t.id)}
                  className="min-h-11 border-l border-[var(--border)] px-1.5 text-[10px] text-[var(--muted)] hover:text-[var(--text)]"
                  title={st?.included === false ? 'Include this token in captions and export' : 'Exclude this token from captions and export'}
                  aria-pressed={st?.included === false}
                >
                  {st?.included === false ? 'incl' : 'excl'}
                </button>
                {fixture && (
                  <button onClick={() => { setCorrecting(t.id); setCorrText('evening'); setCorrNote('Fixture misspelling — corrected per source audio.'); }}
                    className="min-h-11 border-l border-amber-600 bg-amber-900/40 px-1.5 text-[10px] text-amber-200" title="Correct this fixture error">
                    fix
                  </button>
                )}
              </span>
            );
          })}
        </div>

        {correcting && (
          <div className={`${panelCls} mt-3 space-y-2 p-3`}>
            <h4 className="text-sm font-semibold">Correct Token With Provenance</h4>
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <label htmlFor="corr-text" className="block text-[10px] text-[var(--muted)]">Corrected text</label>
                <input id="corr-text" value={corrText} onChange={e => setCorrText(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="corr-note" className="block text-[10px] text-[var(--muted)]">Provenance note</label>
                <input id="corr-note" value={corrNote} onChange={e => setCorrNote(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { store.correctToken(correcting, corrText.trim() || 'evening', corrNote.trim() || 'corrected'); setCorrecting(null); }} className={btnAccent}>Save Correction</button>
              <button onClick={() => setCorrecting(null)} className={btnGhost}>Cancel</button>
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={() => store.bindSpan()} className={btnAccent} title="Bind the selected token span to a new show-note citation">
            Bind Span To Note
          </button>
          {store.citations.filter(c => c.status === 'orphan').map(c => (
            <button key={c.id} onClick={() => store.bindSpan(c.id)} className={btnGhost} title={`Bind the selected span to the orphaned citation “${c.label}”`}>
              Bind To “{c.label}”
            </button>
          ))}
          {sel
            ? <span className="text-xs text-[var(--muted)]">Span: tokens {sel.fromIdx}–{sel.toIdx}</span>
            : <span className="text-xs text-[var(--muted)]">No span selected yet.</span>}
        </div>
      </div>

      <div className={`${panelCls} p-4`}>
        <h3 className="mb-2 text-base font-semibold md:text-sm">Episode Caption Preview</h3>
        <CaptionPreview />
      </div>
    </div>
  );
}

function CaptionPreview() {
  const store = useStore();
  const toks = deriveEpisodeTokens(store).filter(t => t.included).slice(0, 24);
  if (!toks.length) return <p className="text-sm text-[var(--muted)]">No included tokens yet.</p>;
  return (
    <div className="space-y-1 font-mono text-xs text-[var(--muted)]">
      {toks.map(t => (
        <div key={t.id + t.instanceId}><span className="text-[var(--accent)]">{fmt(t.episodeStart)}</span> {t.text}</div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapters
// ---------------------------------------------------------------------------

function ChaptersPanel() {
  const store = useStore();
  const sorted = [...store.chapters].sort((a, b) => a.start - b.start);
  const end = episodeEnd(store.instances);
  const overlaps = sorted.some((c, i) => i < sorted.length - 1 && c.end > sorted[i + 1].start);
  const covered = sorted.length > 0 && sorted[0].start === 0 && sorted[sorted.length - 1].end >= end;

  return (
    <div className="space-y-4">
      <div className={`${panelCls} p-4`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold md:text-sm">Narrative Outline</h3>
          <div className="flex gap-2 text-xs">
            <span className={`rounded px-2 py-1 font-semibold ${overlaps ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>{overlaps ? 'Overlap!' : 'No overlaps'}</span>
            <span className={`rounded px-2 py-1 font-semibold ${covered ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>{covered ? 'Covers timeline' : 'Coverage gap'}</span>
          </div>
        </div>
        {store.showHints && <p className="mb-3 text-xs text-[var(--muted)]">Reordering opens an explicit ripple preview before any clip group moves. Blocks stay contiguous, so chapters can never overlap and always cover the approved timeline.</p>}
        {/* coverage bar */}
        <div className="mb-4 flex h-3 w-full overflow-hidden rounded bg-[var(--panel2)]" role="img" aria-label="Chapter coverage bar">
          {sorted.map((c, i) => (
            <div key={c.id} className="h-full" style={{ width: `${((c.end - c.start) / (sorted[sorted.length - 1]?.end || 1)) * 100}%`, background: i % 2 ? 'var(--accent)' : 'var(--muted)', opacity: 0.7 }} title={`${c.title}: ${fmt(c.start)} – ${fmt(c.end)}`} />
          ))}
        </div>
        <ol className="space-y-2">
          {sorted.map((c, i) => <ChapterRow key={c.id} c={c} first={i === 0} last={i === sorted.length - 1} />)}
        </ol>
      </div>
    </div>
  );
}

function ChapterRow({ c, first, last }: { c: Chapter; first: boolean; last: boolean }) {
  const store = useStore();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(c.title);
  const [summary, setSummary] = useState(c.summary);
  return (
    <li className={`${panelCls} flex gap-2 p-3`}>
      <div className="flex flex-col justify-center gap-1 border-r border-[var(--border)] pr-2">
        <button onClick={() => store.requestReorder(c.id, -1)} disabled={first} className={`${btnGhost} disabled:opacity-30`} title="Move this block earlier (opens ripple preview)"><ChevronUp className="h-4 w-4" /><span className="sr-only">Move {c.title} up</span></button>
        <button onClick={() => store.requestReorder(c.id, 1)} disabled={last} className={`${btnGhost} disabled:opacity-30`} title="Move this block later (opens ripple preview)"><ChevronDown className="h-4 w-4" /><span className="sr-only">Move {c.title} down</span></button>
      </div>
      <div className="min-w-0 flex-1 text-sm">
        {editing ? (
          <div className="space-y-2">
            <div>
              <label htmlFor={`ct-${c.id}`} className="block text-[10px] text-[var(--muted)]">Title</label>
              <input id={`ct-${c.id}`} value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor={`cs-${c.id}`} className="block text-[10px] text-[var(--muted)]">Show-note summary</label>
              <input id={`cs-${c.id}`} value={summary} onChange={e => setSummary(e.target.value)} className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { store.updateChapter(c.id, { title, summary }); setEditing(false); }} className={btnAccent}>Save</button>
              <button onClick={() => setEditing(false)} className={btnGhost}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="font-bold">{c.title} <span className="ml-1 text-xs font-normal text-[var(--accent)]">({c.role})</span></div>
            <div className="text-xs text-[var(--muted)]">{fmt(c.start)} – {fmt(c.end)}</div>
            <div className="mt-0.5 text-xs">{c.summary}</div>
            <div className="mt-0.5 text-[11px] text-[var(--muted)]">Speakers: {c.speakers.length ? c.speakers.join(', ') : '—'} · Topics: {c.topics.join(', ')}</div>
            <button onClick={() => { setTitle(c.title); setSummary(c.summary); setEditing(true); }} className={`${btnGhost} mt-1.5`} title="Edit the block title and show-note summary">Edit</button>
          </>
        )}
      </div>
    </li>
  );
}

function ReorderPreviewModal() {
  const store = useStore();
  const rp = store.reorderPreview!;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Ripple preview">
      <div className={`${panelCls} w-full max-w-lg p-5`}>
        <h3 className="mb-2 text-lg font-bold">Ripple Preview</h3>
        <p className="mb-3 text-sm text-[var(--muted)]">Confirming shifts these blocks and moves their clip groups with them. Chapters stay contiguous — no overlaps, full coverage.</p>
        <ul className="mb-4 space-y-1.5 text-sm">
          {rp.moved.map(m => (
            <li key={m.title} className="flex items-center gap-2">
              <span className="font-semibold">{m.title}</span>
              <span className="font-mono text-xs text-[var(--muted)]">{fmt(m.from[0])}–{fmt(m.from[1])}</span>
              <span aria-hidden>→</span>
              <span className="font-mono text-xs text-[var(--accent)]">{fmt(m.to[0])}–{fmt(m.to[1])}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <button onClick={store.cancelReorder} className={btnGhost}>Cancel</button>
          <button onClick={store.confirmReorder} className={btnAccent}>Confirm Ripple</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mix panel — automation curves + sampled table + validator
// ---------------------------------------------------------------------------

function AutomationEditor({ lane }: { lane: LaneType }) {
  const store = useStore();
  const pts = [...(store.automation[lane] ?? [])].sort((a, b) => a.t - b.t);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<string | null>(null);
  const W = 560, H = 120;
  const x = (t: number) => (t / 300000) * W;
  const y = (v: number) => ((-v) / 40) * H;
  const fromEvent = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const t = Math.min(300000, Math.max(0, ((e.clientX - rect.left) / rect.width) * 300000));
    const v = Math.max(-40, Math.min(0, -(((e.clientY - rect.top) / rect.height) * 40)));
    return { t, v };
  };
  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-32 w-full touch-none rounded bg-[var(--panel2)]"
        role="application"
        aria-label={`${lane} automation curve — drag points on the time and value axes`}
        onPointerMove={e => {
          if (!dragging.current) return;
          const { t, v } = fromEvent(e);
          store.setAutomationPoint(lane, dragging.current, t, v);
        }}
        onPointerUp={() => { dragging.current = null; }}
        onPointerLeave={() => { dragging.current = null; }}
      >
        {[0, -10, -20, -30, -40].map(g => (
          <g key={g}>
            <line x1={0} y1={y(g)} x2={W} y2={y(g)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={2} y={y(g) + 9} fontSize={8} fill="var(--muted)">{g} dB</text>
          </g>
        ))}
        <polyline
          points={pts.map(p => `${x(p.t)},${y(p.v)}`).join(' ')}
          fill="none" stroke={LANE_HEX[lane]} strokeWidth={2}
        />
        {pts.map(p => (
          <circle
            key={p.id} cx={x(p.t)} cy={y(p.v)} r={7}
            fill={LANE_HEX[lane]} stroke="white" strokeWidth={1.5}
            style={{ cursor: 'grab' }}
            onPointerDown={e => { (e.target as Element).setPointerCapture?.(e.pointerId); dragging.current = p.id; }}
          />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        {pts.map((p, i) => (
          <div key={p.id} className="flex items-end gap-1 rounded border border-[var(--border)] p-1.5">
            <NumField id={`ap-t-${p.id}`} label={`P${i + 1} time (ms)`} value={p.t} onCommit={v => store.setAutomationPoint(lane, p.id, v, p.v)} />
            <NumField id={`ap-v-${p.id}`} label="dB" value={p.v} step={1} min={-40} onCommit={v => store.setAutomationPoint(lane, p.id, p.t, v)} />
            <button onClick={() => store.deleteAutomationPoint(lane, p.id)} className={btnGhost} title="Delete this automation point"><X className="h-4 w-4" /><span className="sr-only">Delete point</span></button>
          </div>
        ))}
        <button onClick={() => store.addAutomationPoint(lane)} className={btnGhost} title="Add an automation point at the curve midpoint">+ Point</button>
      </div>
    </div>
  );
}

function MixPanel() {
  const store = useStore();
  const [lane, setLane] = useState<LaneType>('dialogue');
  const samples = useMemo(() => sampleMix(store), [store.instances, store.automation, store.laneFlags]);
  const findings = useMemo(() => runValidation(store), [store.instances, store.automation, store.laneFlags]);
  const times: number[] = [];
  for (let t = 0; t <= 300000; t += 30000) times.push(t);

  return (
    <div className="space-y-4">
      <div className={`${panelCls} p-4`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold md:text-sm">Mix Automation</h3>
          <div className="flex items-center gap-2">
            <label htmlFor="lane-pick" className="text-xs text-[var(--muted)]">Lane</label>
            <select id="lane-pick" value={lane} onChange={e => setLane(e.target.value as LaneType)} className={`${inputCls} w-auto`}>
              {AUTOMATION_LANES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        {store.showHints && <p className="mb-3 text-xs text-[var(--muted)]">Drag the points on both axes (time and dB) or type exact values. Sampled loudness below interpolates linearly between points and adds each clip’s gain — deterministically.</p>}
        <AutomationEditor lane={lane} />
      </div>

      <div className={`${panelCls} overflow-x-auto p-4`}>
        <h3 className="mb-2 text-base font-semibold md:text-sm">Sampled Loudness And Peak (Linear Interpolation)</h3>
        <table className="w-full min-w-[520px] text-left font-mono text-xs">
          <thead>
            <tr className="text-[var(--muted)]">
              <th className="py-1 pr-2 font-semibold">Lane</th>
              {times.map(t => <th key={t} className="py-1 pr-2 font-semibold">{t / 1000}s</th>)}
            </tr>
          </thead>
          <tbody>
            {AUTOMATION_LANES.map(l => (
              <React.Fragment key={l}>
                <tr>
                  <td className="py-0.5 pr-2" style={{ color: LANE_HEX[l] }}>{l} dB</td>
                  {times.map(t => {
                    const s = samples.find(x => x.lane === l && x.t === t);
                    return <td key={t} className="py-0.5 pr-2">{s?.loudness === null || s?.loudness === undefined ? '—' : s.loudness.toFixed(1)}</td>;
                  })}
                </tr>
                <tr className="text-[var(--muted)]">
                  <td className="py-0.5 pr-2">{l} peak</td>
                  {times.map(t => {
                    const s = samples.find(x => x.lane === l && x.t === t);
                    return <td key={t} className="py-0.5 pr-2">{s?.peak === null || s?.peak === undefined ? '—' : s.peak.toFixed(1)}</td>;
                  })}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`${panelCls} p-4`}>
        <h3 className="mb-2 text-base font-semibold md:text-sm">Validation Findings</h3>
        <ul className="space-y-2">
          {findings.map(f => (
            <li key={f.id} className={`flex items-start gap-2 rounded border p-2.5 text-sm ${f.status === 'fail' ? 'border-red-800 bg-red-950/40 text-red-200' : 'border-green-800 bg-green-950/40 text-green-200'}`}>
              {f.status === 'fail' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{f.message}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rights panel
// ---------------------------------------------------------------------------

function RightsPanel() {
  const store = useStore();
  const includedIds = [...new Set(store.instances.map(i => i.sourceId))];
  const included = includedIds.map(id => store.sources.find(s => s.id === id)!);
  return (
    <div className={`${panelCls} p-4`}>
      <h3 className="mb-1 text-base font-semibold md:text-sm">Rights Review</h3>
      <p className="mb-3 text-xs text-[var(--muted)]">Every source on the timeline needs allowed usage, a territory fixture, attribution text, and an expiry after the publish date ({PUBLISH_DATE}). Gaps block rights approval with a named reason.</p>
      {included.length === 0 && <p className="text-sm italic text-[var(--muted)]">No sources on the timeline yet.</p>}
      <ul className="space-y-3">
        {included.map(src => <RightsRow key={src.id} src={src} />)}
      </ul>
    </div>
  );
}

function RightsRow({ src }: { src: Source }) {
  const store = useStore();
  const [attr, setAttr] = useState(src.attribution);
  const problems: string[] = [];
  if (src.rightsState === 'forbidden') problems.push('rights state forbidden');
  if (!src.attribution.trim()) problems.push('attribution missing');
  return (
    <li className={`${panelCls} p-3 ${problems.length ? 'border-amber-700' : ''}`}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold">{src.name}</span>
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${problems.length ? 'bg-amber-900 text-amber-200' : 'bg-green-900 text-green-200'}`}>
          {problems.length ? problems.join(' · ') : 'complete'}
        </span>
      </div>
      <div className="grid gap-1 text-xs text-[var(--muted)] md:grid-cols-2">
        <div>Allowed usage: {src.allowedUsage || '—'}</div>
        <div>Territory: {src.territory || '—'}</div>
        <div>Expiry: publish + {src.expiryDaysAfterPublish} days</div>
        <div>State: {src.rightsState}</div>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor={`attr-${src.id}`} className="block text-[10px] text-[var(--muted)]">Attribution text</label>
          <input id={`attr-${src.id}`} value={attr} onChange={e => setAttr(e.target.value)} className={inputCls} placeholder="e.g. Recorded by Side Street Signals" />
        </div>
        <button onClick={() => store.setRights(src.id, { attribution: attr })} className={btnAccent} title="Save the attribution text for this source">Save</button>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Branches panel
// ---------------------------------------------------------------------------

const CATEGORIES = ['clips', 'transcript', 'chapters', 'mix', 'duration', 'rights', 'notes'] as const;

function BranchesPanel() {
  const store = useStore();
  const main = store.forks['main'];
  const onFork = store.branch !== 'main';

  const describe = (cat: string, side: 'main' | 'fork'): string => {
    const inst = side === 'fork' || !main ? store.instances : main.instances;
    const chap = side === 'fork' || !main ? store.chapters : main.chapters;
    const tok = side === 'fork' || !main ? store.tokenState : main.tokenState;
    const cites = side === 'fork' || !main ? store.citations : main.citations;
    const auto = side === 'fork' || !main ? store.automation : main.automation;
    const notes = side === 'fork' || !main ? store.notes : main.notes;
    switch (cat) {
      case 'clips': return `${inst.length} clip(s): ${inst.map(i => `${i.sourceId}@${i.start}`).join(', ') || '—'}`;
      case 'transcript': return `${Object.values(tok).filter(t => !t.included).length} excluded, ${Object.values(tok).filter(t => t.correction).length} corrected, ${cites.filter(c => c.status === 'bound').length}/${cites.length} citations bound`;
      case 'chapters': return chap.map(c => c.title.split(' — ')[0]).join(' · ');
      case 'mix': return AUTOMATION_LANES.map(l => `${l}: ${(auto[l] ?? []).length} pts`).join(', ');
      case 'duration': return fmt(episodeEnd(inst));
      case 'rights': {
        const srcs = side === 'fork' || !main ? store.sources : store.sources.map(s => ({ ...s, ...main.rights[s.id] }));
        return `${srcs.filter(s => !s.attribution.trim()).length} missing attribution`;
      }
      case 'notes': return notes.slice(0, 48) + (notes.length > 48 ? '…' : '');
      default: return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className={`${panelCls} p-4`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold md:text-sm">Branch Cuts</h3>
          <button onClick={() => store.branchCut()} className={btnAccent} title="Fork the current cut into a new branch for comparison"><GitBranch className="h-4 w-4" /> Fork This Cut</button>
        </div>
        <p className="mb-2 text-xs text-[var(--muted)]">Current branch: <span className="font-mono text-[var(--accent)]">{store.branch}</span>. Forking snapshots the current cut so the two can be compared property by property and merged with per-category conflict picks.</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(store.forks).map(name => (
            <button key={name} onClick={() => store.switchBranch(name)} className={btnGhost} title={`Switch to branch ${name} (its saved cut state loads)`}>
              {name} · {store.forks[name].instances.length} clips
            </button>
          ))}
          {Object.keys(store.forks).length === 0 && <span className="text-sm italic text-[var(--muted)]">No other branches yet — fork the cut to start comparing.</span>}
        </div>
      </div>

      {onFork && main && (
        <div className={`${panelCls} overflow-x-auto p-4`}>
          <h3 className="mb-2 text-base font-semibold md:text-sm">Compare And Merge — {store.branch} vs main</h3>
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="text-[var(--muted)]">
                <th className="py-1.5 pr-3 font-semibold">Property</th>
                <th className="py-1.5 pr-3 font-semibold">Main</th>
                <th className="py-1.5 pr-3 font-semibold">This Fork</th>
                <th className="py-1.5 font-semibold">Resolution</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(cat => {
                const a = describe(cat, 'main');
                const b = describe(cat, 'fork');
                const conflict = a !== b;
                const mergeCat = cat === 'duration' ? 'clips' : cat;
                return (
                  <tr key={cat} className={`border-t border-[var(--border)] ${conflict ? '' : 'opacity-60'}`}>
                    <td className="py-1.5 pr-3 font-semibold capitalize">{cat}{conflict && <span className="ml-1 rounded bg-amber-900 px-1 text-[9px] text-amber-200">conflict</span>}</td>
                    <td className="max-w-[180px] truncate py-1.5 pr-3" title={a}>{a}</td>
                    <td className="max-w-[180px] truncate py-1.5 pr-3" title={b}>{b}</td>
                    <td className="py-1.5">
                      {conflict ? (
                        <div className="flex gap-1">
                          <button onClick={() => store.setMergeChoice(mergeCat, 'main')} className={`${btnGhost} ${store.mergeChoices[mergeCat] === 'main' ? 'ring-2 ring-[var(--accent)]' : ''}`} title={`Resolve ${cat} by keeping main`}>Keep Main</button>
                          <button onClick={() => store.setMergeChoice(mergeCat, 'fork')} className={`${btnGhost} ${(store.mergeChoices[mergeCat] ?? 'fork') === 'fork' ? 'ring-2 ring-[var(--accent)]' : ''}`} title={`Resolve ${cat} by keeping this fork`}>Keep Fork</button>
                        </div>
                      ) : <span className="text-[var(--muted)]">identical</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-3 flex justify-end">
            <button onClick={store.applyMerge} className={btnAccent} title="Apply the per-category resolutions and merge this fork back into main">Apply Merge Into Main</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Render panel
// ---------------------------------------------------------------------------

function RenderPanel({ loading, withLoading }: { loading: string | null; withLoading: (k: string, fn: () => void, d?: number) => void }) {
  const store = useStore();
  const rp = store.renderPipeline;
  const failedKeys = OUTPUT_KEYS.filter(k => rp.outputs[k] === 'failed');
  return (
    <div className="space-y-4">
      <div className={`${panelCls} p-4`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold md:text-sm">Render Pipeline</h3>
          <div className="flex gap-2">
            <button onClick={() => withLoading('render', () => store.startRender(), 900)} className={btnAccent} title="Run the render batch (requires all five approvals)">
              {loading === 'render' ? <Loader className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Render
            </button>
            {rp.status === 'failed' && (
              <button onClick={() => withLoading('retry', () => store.retryFailed(), 900)} className={`${btn} bg-orange-700 text-white hover:bg-orange-600`} title="Retry only the failed outputs, preserving successful ones">
                {loading === 'retry' ? <Loader className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Retry Failed Only
              </button>
            )}
          </div>
        </div>
        {rp.blockedReason && <div role="alert" className="mb-3 rounded border border-red-800 bg-red-950/50 p-2.5 text-sm text-red-200">{rp.blockedReason}</div>}
        {rp.status === 'failed' && (
          <div role="alert" className="mb-3 rounded border border-amber-700 bg-amber-950/50 p-2.5 text-sm text-amber-100">
            Attempt {rp.attempts.length} failed deterministically: the transcript timestamp check and the RSS enclosure check rejected their outputs. Successful outputs are preserved — Retry Failed Only re-renders just the two failures.
          </div>
        )}
        <ol className="grid gap-2 md:grid-cols-2">
          {OUTPUT_KEYS.map(k => (
            <motion.li layout key={k} className={`flex items-center justify-between rounded border p-2.5 text-sm ${rp.outputs[k] === 'failed' ? 'border-red-800 bg-red-950/40' : rp.outputs[k] === 'success' ? 'border-green-800 bg-green-950/40' : 'border-[var(--border)] bg-[var(--panel2)]'}`}>
              <span>{OUTPUT_LABELS[k]}</span>
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${rp.outputs[k] === 'failed' ? 'bg-red-800 text-red-100' : rp.outputs[k] === 'success' ? 'bg-green-800 text-green-100' : 'bg-[var(--border)] text-[var(--muted)]'}`}>
                {rp.outputs[k]}
              </span>
            </motion.li>
          ))}
        </ol>
        {failedKeys.length > 0 && (
          <p className="mt-2 text-xs text-[var(--muted)]">Failing checks: transcript timestamps (token stamp outside its clip range) and RSS enclosure (declared length mismatch) — both deterministic fixture failures on the first batch.</p>
        )}
      </div>

      <div className={`${panelCls} p-4`}>
        <h3 className="mb-2 text-base font-semibold md:text-sm">Attempt History ({rp.attempts.length})</h3>
        {rp.attempts.length === 0
          ? <p className="text-sm italic text-[var(--muted)]">No render attempts yet. The first batch always fails its transcript timestamp and RSS enclosure checks.</p>
          : (
            <ol className="space-y-2 text-xs">
              {rp.attempts.map(a => (
                <li key={a.n} className="rounded border border-[var(--border)] p-2.5">
                  <span className="font-bold">Attempt {a.n}</span> · {a.kind}
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {OUTPUT_KEYS.map(k => (
                      <span key={k} className={`rounded px-1.5 py-0.5 ${a.results[k] === 'failed' ? 'bg-red-900 text-red-200' : a.results[k] === 'preserved' ? 'bg-[var(--panel2)] text-[var(--muted)]' : 'bg-green-900 text-green-200'}`}>
                        {OUTPUT_LABELS[k]}: {a.results[k]}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export / import panel
// ---------------------------------------------------------------------------

function ExportPanel() {
  const store = useStore();
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, data: string) => {
    try {
      await navigator.clipboard.writeText(data);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      store.addToast('info', 'Clipboard unavailable — use the download instead.');
    }
  };

  return (
    <div className="space-y-4">
      <div className={`${panelCls} p-4`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold md:text-sm">Export Artifacts</h3>
          <div className="flex gap-2">
            <button onClick={() => store.generateExport()} className={btnAccent} title="Generate all seven artifacts from the live cut state">
              <Download className="h-4 w-4" /> {Object.keys(store.exportOutputs).length ? 'Re-Export' : 'Export All'}
            </button>
            <button onClick={() => store.resetAll()} className={btnGhost} title="Reset the whole workspace to its deterministic starter fixtures"><Undo2 className="h-4 w-4" /> Reset Workspace</button>
          </div>
        </div>
        {store.companionsIdentical !== null && (
          <div className={`mb-3 rounded border p-2.5 text-sm ${store.companionsIdentical ? 'border-green-800 bg-green-950/40 text-green-200' : 'border-amber-700 bg-amber-950/40 text-amber-100'}`}>
            {store.companionsIdentical
              ? 'Re-export check: CSV, VTT, RSS, Markdown, and SVG are byte-identical to the previous export — only exportedAt changed in the canonical JSON.'
              : 'Re-export check: companions changed because the cut state changed since the last export.'}
          </div>
        )}
        {Object.keys(store.exportOutputs).length === 0
          ? <p className="text-sm italic text-[var(--muted)]">Nothing exported yet — Export All produces canonical JSON plus CSV, VTT, RSS, Markdown, and SVG companions.</p>
          : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(store.exportOutputs).map(([key, data]) => {
                const meta = ARTIFACT_META[key];
                return (
                  <div key={key} className={`${panelCls} flex flex-col gap-2 p-3`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{meta?.label ?? key}</span>
                      <span className="font-mono text-[10px] text-[var(--muted)]">{data.length} B</span>
                    </div>
                    {key === 'timeline-svg'
                      ? <img alt="Timeline and loudness report preview" className="max-h-28 w-full rounded bg-black/30 object-contain" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(data)}`} />
                      : <pre className="max-h-28 overflow-auto rounded bg-black/30 p-2 font-mono text-[10px] leading-snug">{data.slice(0, 400)}{data.length > 400 ? '…' : ''}</pre>}
                    <div className="flex gap-1.5">
                      <a
                        href={`data:${meta?.mime ?? 'text/plain'};charset=utf-8,${encodeURIComponent(data)}`}
                        download={`night-market-economies.${meta?.ext ?? 'txt'}`}
                        className={btnAccent}
                        title={`Download the ${meta?.label ?? key} artifact`}
                      >
                        <Download className="h-4 w-4" /> Download
                      </a>
                      <button onClick={() => copy(key, data)} className={btnGhost} title="Copy this artifact to the clipboard">
                        {copied === key ? <Check className="h-4 w-4 text-green-400" /> : <Clipboard className="h-4 w-4" />} {copied === key ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      <div className={`${panelCls} p-4`}>
        <h3 className="mb-1 text-base font-semibold md:text-sm">Import Canonical JSON</h3>
        <p className="mb-2 text-xs text-[var(--muted)]">Paste a podcast-episode-package/v1 document. Invalid artifacts are rejected with the offending fields named, and nothing changes.</p>
        <label htmlFor="import-area" className="sr-only">Canonical JSON to import</label>
        <textarea
          id="import-area"
          value={importText}
          onChange={e => setImportText(e.target.value)}
          rows={5}
          placeholder='{"schemaVersion":"podcast-episode-package/v1", …}'
          className={`${inputCls} font-mono text-[11px]`}
        />
        {store.importError && (
          <div role="alert" className="mt-2 rounded border border-red-800 bg-red-950/50 p-2.5 text-sm text-red-200">
            <div className="mb-1 font-semibold">Import rejected — offending fields:</div>
            <ul className="list-inside list-disc space-y-0.5 text-xs">
              {store.importError.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <button onClick={() => store.importData(importText)} className={btnAccent} title="Validate and reconstruct the cut from the pasted canonical JSON">Import</button>
          <button onClick={() => { const j = store.exportOutputs['canonical-json']; if (j) setImportText(j); else store.addToast('info', 'Export first, then the canonical JSON can be pasted here.'); }} className={btnGhost} title="Paste the last exported canonical JSON into the box">
            Use Last Export
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right-rail sections
// ---------------------------------------------------------------------------

function ApprovalStepper({ loading, withLoading, vertical }: { loading: string | null; withLoading: (k: string, fn: () => void, d?: number) => void; vertical?: boolean }) {
  const store = useStore();
  const [expanded, setExpanded] = useState<ApprovalCat | null>(null);
  const rp = store.renderPipeline;
  const shouldReduceMotion = useReducedMotion();

  return (
    <section aria-label="Approval and render stepper">
      <h3 className="mb-2 text-base font-semibold md:text-sm">Approval And Render Stepper</h3>
      <ol className={`flex ${vertical ? 'flex-col gap-1.5' : 'flex-row flex-wrap gap-2'}`}>
        {APPROVAL_CATS.map((cat, i) => {
          const a = store.approvals[cat];
          const blockers = store.approvalBlockers(cat);
          return (
            <li key={cat} className={`${panelCls} p-2.5`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--panel2)] text-xs font-bold">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold capitalize">{cat}</div>
                    <div className="truncate font-mono text-[10px] text-[var(--muted)]" title={a.staleReason ?? (a.checksum ? `Frozen cut checksum ${a.checksum}` : 'No checksum frozen yet')}>
                      {a.checksum ? `checksum ${a.checksum}` : 'no checksum yet'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.span
                    key={a.status}
                    initial={shouldReduceMotion ? false : { scale: 1.25 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.35, type: 'spring' }}
                    className={`rounded px-2 py-1 text-[10px] font-bold ${a.status === 'approved' ? 'bg-green-800 text-green-100' : a.status === 'stale' ? 'bg-yellow-700 text-yellow-100' : 'bg-red-900 text-red-100'}`}
                  >
                    {a.status}
                  </motion.span>
                  <button
                    onClick={() => blockers.length ? setExpanded(e2 => e2 === cat ? null : cat) : withLoading(`approve-${cat}`, () => store.approveCategory(cat), 500)}
                    className={btnGhost}
                    title={blockers.length ? `${blockers.length} blocker(s) — click to list them` : `Approve ${cat} and freeze the current cut checksum`}
                  >
                    {loading === `approve-${cat}` ? <Loader className="h-4 w-4 animate-spin" /> : blockers.length ? `${blockers.length} blocker${blockers.length > 1 ? 's' : ''}` : 'Approve'}
                  </button>
                </div>
              </div>
              {a.status === 'stale' && a.staleReason && (
                <p className="mt-1.5 rounded bg-yellow-950/50 p-1.5 text-[11px] text-yellow-200">Stale: {a.staleReason} — re-approve after review.</p>
              )}
              {expanded === cat && blockers.length > 0 && (
                <ul className="mt-1.5 list-inside list-disc space-y-1 rounded bg-red-950/40 p-2 text-[11px] text-red-200">
                  {blockers.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </li>
          );
        })}
        <li className={`${panelCls} flex items-center justify-between p-2.5`}>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--panel2)] text-xs font-bold">6</span>
            <span className="text-sm font-semibold">Render</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`rounded px-2 py-1 text-[10px] font-bold ${rp.status === 'success' ? 'bg-green-800 text-green-100' : rp.status === 'failed' ? 'bg-red-900 text-red-100' : 'bg-[var(--panel2)] text-[var(--muted)]'}`}>{rp.status}</span>
            <button onClick={() => store.setMode('render')} className={btnGhost} title="Open the render pipeline">Open</button>
          </div>
        </li>
      </ol>
    </section>
  );
}

function CitationsSection() {
  const store = useStore();
  return (
    <section aria-label="Citations">
      <h3 className="mb-2 text-base font-semibold md:text-sm">Citations</h3>
      <ul className="space-y-1.5">
        {store.citations.map(c => (
          <li key={c.id} className={`${panelCls} p-2.5 text-xs`}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold">{c.label}</span>
              {c.status === 'orphan'
                ? <button onClick={() => store.fixCitation(c.id)} className={`${btn} bg-red-800 text-red-100 hover:bg-red-700`} title="Bind this orphaned citation to a transcript span (orphans block approval)">Fix Orphan</button>
                : <span className="flex items-center gap-1 font-bold text-green-400"><Check className="h-3.5 w-3.5" /> bound</span>}
            </div>
            {c.span
              ? <p className="mt-1 text-[var(--muted)]">“{c.span.text}” · {c.span.sourceId} [{c.span.startMs}–{c.span.endMs} ms]</p>
              : <p className="mt-1 text-[var(--muted)]">{c.note} Unbound citations block transcript and editorial approval.</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function HistorySection() {
  const store = useStore();
  return (
    <section aria-label="History log">
      <h3 className="mb-2 text-base font-semibold md:text-sm">History Log</h3>
      {store.history.length === 0
        ? <p className="text-xs italic text-[var(--muted)]">No actions yet — every edit lands here with its revision number.</p>
        : (
          <ol className="max-h-48 space-y-1 overflow-y-auto text-[11px] text-[var(--muted)]">
            {store.history.slice(0, 14).map(h => (
              <li key={h.rev} className="rounded bg-[var(--panel2)] px-2 py-1">
                <span className="font-mono text-[var(--accent)]">r{h.rev}</span> <span className="font-semibold">{h.action}</span> — {h.detail}
              </li>
            ))}
          </ol>
        )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

function ToastItem({ id, kind, message, actionLabel }: { id: string; kind: string; message: string; actionLabel?: string }) {
  const store = useStore();
  useEffect(() => {
    const t = window.setTimeout(() => store.removeToast(id), 5000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      layout
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
      role="status"
      className={`pointer-events-auto flex items-start gap-2 rounded-lg border p-3 text-sm shadow-xl ${kind === 'error' ? 'border-red-700 bg-red-950 text-red-100' : kind === 'success' ? 'border-green-700 bg-green-950 text-green-100' : 'border-[var(--border)] bg-[var(--panel)] text-[var(--text)]'}`}
    >
      {kind === 'error' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : kind === 'success' ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />}
      <span className="flex-1">{message}</span>
      {actionLabel && (
        <button onClick={() => store.toastAction(id)} className="rounded bg-white/15 px-2 py-1 text-xs font-bold hover:bg-white/25" title={actionLabel}>{actionLabel}</button>
      )}
      <button onClick={() => store.removeToast(id)} className="text-xs opacity-70 hover:opacity-100" title="Dismiss notification"><X className="h-4 w-4" /><span className="sr-only">Dismiss</span></button>
    </motion.div>
  );
}

function Toasts() {
  const store = useStore();
  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-[60] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {store.toasts.map(t => <ToastItem key={t.id} {...t} />)}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modals: onboarding, palette, settings, help
// ---------------------------------------------------------------------------

const ONBOARD_STEPS = [
  {
    title: 'Stories From The City After Dark',
    body: 'Side Street Signals is a late-night documentary series. Tonight you are assembling S03E07, “Night Market Economies” — 24 deterministic source clips are waiting in the bin, each with its transcript, rights record, and an immutable media hash.',
  },
  {
    title: 'Cut The Timeline, Keep The Provenance',
    body: 'Drag sources onto dialogue, cross-talk, music, ambient, or marker lanes — or set an in/out range and press Insert. Trim, split, ripple, gap-close, fade, and crossfade with pointer, keyboard, or numeric fields; every edit snaps to integer milliseconds.',
  },
  {
    title: 'Approve, Render, Ship',
    body: 'Bind citations, clear rights, and pass the mix validator; each approval freezes a cut checksum and goes stale if you keep editing. The first render batch always fails two checks — retry failed-only, then export the full artifact package.',
  },
];

function Onboarding({ step, setStep, close, reduce }: { step: number; setStep: (n: number) => void; close: () => void; reduce: boolean }) {
  const s = ONBOARD_STEPS[step];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Welcome tour">
      <motion.div
        key={step}
        initial={reduce ? false : { scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reduce ? 0 : 0.3 }}
        className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--panel)] p-7 text-[var(--text)]"
      >
        <div className="mb-3 flex items-center gap-2 text-[var(--accent)]">
          <Sparkles className="h-5 w-5" aria-hidden />
          <span className="text-xs font-bold tracking-widest">SIDE STREET SIGNALS</span>
        </div>
        <h2 className="mb-2 text-xl font-bold">{s.title}</h2>
        <p className="mb-5 text-sm text-[var(--muted)]">{s.body}</p>
        <div className="mb-5 flex justify-center gap-1.5" aria-label={`Step ${step + 1} of ${ONBOARD_STEPS.length}`}>
          {ONBOARD_STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 w-6 rounded-full ${i === step ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
          ))}
        </div>
        <div className="flex justify-between gap-2">
          <button onClick={close} className={btnGhost} title="Skip the tour and start editing">Skip Tour</button>
          {step < ONBOARD_STEPS.length - 1
            ? <button onClick={() => setStep(step + 1)} className={btnAccent}>Next</button>
            : <button onClick={close} className={btnAccent}>Start Assembling</button>}
        </div>
      </motion.div>
    </div>
  );
}

function CommandPalette({ close }: { close: () => void }) {
  const store = useStore();
  const [q, setQ] = useState('');
  const commands: { label: string; run: () => void }[] = [
    { label: 'Go To Timeline', run: () => store.setMode('timeline') },
    { label: 'Go To Transcript', run: () => store.setMode('transcript') },
    { label: 'Go To Chapters', run: () => store.setMode('chapters') },
    { label: 'Go To Mix And Validation', run: () => store.setMode('mix') },
    { label: 'Go To Rights Review', run: () => store.setMode('rights') },
    { label: 'Go To Branch Cuts', run: () => store.setMode('branches') },
    { label: 'Run Render Batch', run: () => { store.setMode('render'); store.startRender(); } },
    { label: 'Retry Failed Outputs Only', run: () => { store.setMode('render'); store.retryFailed(); } },
    { label: 'Export All Artifacts', run: () => { store.setMode('export'); store.generateExport(); } },
    { label: 'Fork This Cut', run: () => store.branchCut() },
    { label: 'Toggle Theme', run: () => store.setTheme(store.theme === 'dark' ? 'light' : 'dark') },
    { label: 'Reset Workspace To Fixtures', run: () => store.resetAll() },
  ].filter(c => c.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette" onClick={close}>
      <div className={`${panelCls} w-full max-w-md p-3`} onClick={e => e.stopPropagation()}>
        <label htmlFor="cmd-q" className="sr-only">Search commands</label>
        <input id="cmd-q" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Type a command…" className={inputCls} />
        <ul className="mt-2 max-h-72 space-y-0.5 overflow-y-auto">
          {commands.map(c => (
            <li key={c.label}>
              <button onClick={() => { c.run(); close(); }} className="w-full rounded px-3 py-2.5 text-left text-sm hover:bg-[var(--panel2)]">{c.label}</button>
            </li>
          ))}
          {commands.length === 0 && <li className="px-3 py-2 text-sm italic text-[var(--muted)]">No matching command.</li>}
        </ul>
      </div>
    </div>
  );
}

function SettingsModal({ close }: { close: () => void }) {
  const store = useStore();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Workspace preferences" onClick={close}>
      <div className={`${panelCls} w-full max-w-sm space-y-4 p-5`} onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Workspace Preferences</h3>
        <div>
          <span className="mb-1 block text-xs text-[var(--muted)]">Color theme</span>
          <div className="flex gap-2">
            <button onClick={() => store.setTheme('dark')} className={`${btnGhost} ${store.theme === 'dark' ? 'ring-2 ring-[var(--accent)]' : ''}`}><Moon className="h-4 w-4" /> Dark</button>
            <button onClick={() => store.setTheme('light')} className={`${btnGhost} ${store.theme === 'light' ? 'ring-2 ring-[var(--accent)]' : ''}`}><Sun className="h-4 w-4" /> Light</button>
          </div>
        </div>
        <div>
          <span className="mb-1 block text-xs text-[var(--muted)]">Accent color</span>
          <div className="flex gap-2">
            {(['violet', 'sky', 'amber'] as const).map(a => (
              <button key={a} onClick={() => store.setAccent(a)} className={`${btnGhost} capitalize ${store.accent === a ? 'ring-2 ring-[var(--accent)]' : ''}`}>{a}</button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="pref-snap" className="mb-1 block text-xs text-[var(--muted)]">Default snap mode</label>
          <select id="pref-snap" value={store.snapMode} onChange={e => store.setSnapMode(e.target.value as SnapMode)} className={inputCls}>
            <option value="ms10">10 ms grid</option>
            <option value="token">Token boundaries</option>
            <option value="chapter">Chapter markers</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Show workflow hints</span>
          <button onClick={() => store.setShowHints(!store.showHints)} aria-pressed={store.showHints} className={`${btnGhost} ${store.showHints ? 'ring-2 ring-[var(--accent)]' : ''}`}>{store.showHints ? 'On' : 'Off'}</button>
        </div>
        <p className="text-[11px] text-[var(--muted)]">Preferences live in memory for this session — the workspace keeps no browser storage.</p>
        <div className="flex justify-end"><button onClick={close} className={btnAccent}>Done</button></div>
      </div>
    </div>
  );
}

function HelpModal({ close }: { close: () => void }) {
  const rows: [string, string][] = [
    ['Ctrl/⌘ + K', 'Command palette'],
    ['Alt + 1–9', 'Open Sources, Timeline, Transcript, Chapters, Mix, Rights, Branches, Render, or Export'],
    ['? ', 'Toggle this help'],
    ['← / →', 'Move selected clip 10 ms (Shift: 1 s, Alt: ripple)'],
    ['[ and ]', 'Trim head/tail 10 ms earlier/later (Shift: 1 s)'],
    ['{ and }', 'Trim head/tail the other direction'],
    ['S', 'Split selected clip at its midpoint'],
    ['M', 'Mute/unmute selected clip'],
    ['G', 'Close the gap before the selected clip'],
    ['Delete', 'Remove selected clip (undo offered)'],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Help" onClick={close}>
      <div className={`${panelCls} w-full max-w-md p-5`} onClick={e => e.stopPropagation()}>
        <h3 className="mb-1 flex items-center gap-2 text-lg font-bold"><Keyboard className="h-5 w-5" /> Keyboard Reference</h3>
        <p className="mb-3 text-xs text-[var(--muted)]">Every pointer gesture has a keyboard or numeric-field equivalent — insert with a source card’s Insert button, edit times in the Selected Clip fields, and use these shortcuts:</p>
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-t border-[var(--border)]">
                <td className="py-1.5 pr-3 font-mono text-xs text-[var(--accent)]">{k}</td>
                <td className="py-1.5 text-xs">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end"><button onClick={close} className={btnAccent}>Close</button></div>
      </div>
    </div>
  );
}

function CutCoach({ close }: { close: () => void }) {
  const store = useStore();
  const pending = APPROVAL_CATS.find(cat => store.approvals[cat].status !== 'approved');
  const blockers = pending ? store.approvalBlockers(pending) : [];
  const next = pending
    ? blockers[0] ?? `Approve ${pending} to freeze checksum ${cutChecksum(store)}.`
    : store.renderPipeline.status === 'failed'
      ? 'Retry only the failed transcript timestamp and RSS enclosure outputs.'
      : store.renderPipeline.status === 'success'
        ? 'Export and share the completed package.'
        : 'Run the deterministic render batch.';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Cut Coach" onClick={close}>
      <div className={`${panelCls} w-full max-w-lg overflow-hidden`} onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-sky-600 via-violet-600 to-amber-500 p-5 text-white">
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]"><Sparkles className="h-4 w-4" /> Live Risk Forecast</div>
          <h2 className="text-2xl font-bold">One move closer to air.</h2>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-sm text-[var(--muted)]">The coach derives its recommendation from the live cut, approval checksums, citations, rights, mix findings, and render attempts.</p>
          <div className="rounded-lg border border-[var(--accent)] bg-[var(--panel2)] p-4">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Next Best Action</div>
            <p className="text-base font-semibold">{next}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded bg-[var(--panel2)] p-2"><strong className="block text-lg">{store.instances.length}</strong>clips</div>
            <div className="rounded bg-[var(--panel2)] p-2"><strong className="block text-lg">{store.citations.filter(c => c.status === 'orphan').length}</strong>orphan cites</div>
            <div className="rounded bg-[var(--panel2)] p-2"><strong className="block text-lg">{APPROVAL_CATS.filter(c => store.approvals[c].status === 'approved').length}/5</strong>approvals</div>
          </div>
          <div className="flex justify-end"><button onClick={close} className={btnAccent}>Back To The Cut</button></div>
        </div>
      </div>
    </div>
  );
}
