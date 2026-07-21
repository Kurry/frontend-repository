import { useRef, useEffect, useState, useLayoutEffect } from 'preact/hooks';
import {
  mode, outputBuffer, commandHistory, theme, bootStep, bootComplete, welcomeShown,
  identity, easterEgg, lastMode, configTab,
  appendLine, undo, redo, canUndo, canRedo,
} from './store.js';
import { processCommand, getCompletions } from './commands.js';
import gsap from 'gsap';

const BOOT_LINES = [
  { text: 'Initializing portfolio system...', tone: 'dim' },
  { text: 'Loading design tokens...', tone: 'dim' },
  { text: 'Mounting component library... [done]', tone: 'dim', ok: true },
  { text: 'Resolving case studies... [ok]', tone: 'dim', ok: true },
  { text: 'Connecting to design systems core... ok', tone: 'dim', ok: true },
  { text: 'Design systems: operational', tone: 'dim' },
  { text: 'UX research modules: loaded', tone: 'dim' },
  { text: "Don't search for /secrets here...", tone: 'dim' },
  { text: 'Strategic thinking: engaged', tone: 'dim' },
];

const ASCII = [
  '  ____            _                _    _ ',
  ' |  _ \\  ___  ___(_)_ __ ___  __ _| |_ (_)',
  " | | | |/ _ \\/ __| | '__/ _ \\/ _` | __|| |",
  ' | |_| |  __/\\__ \\ | | |  __/ (_| | |_ | |',
  ' |____/ \\___||___/_|_|  \\___|\\__,_|\\__||_|',
];

const WELCOME_HTML = `<div class="welcome">
  <pre class="ascii" aria-label="Designer portfolio terminal banner">${ASCII.join('\n')}</pre>
  <div class="welcome-grid">
    <section class="welcome-col" aria-label="Capabilities">
      <h2 class="welcome-h">Capabilities</h2>
      <ul class="welcome-list">
        <li>Design systems &amp; tokens</li>
        <li>UX research &amp; synthesis</li>
        <li>Data visualization</li>
        <li>Prototyping &amp; interaction</li>
      </ul>
    </section>
    <section class="welcome-col" aria-label="Navigation">
      <h2 class="welcome-h">Navigation</h2>
      <ul class="welcome-list">
        <li><code>/work</code> selected case studies</li>
        <li><code>/about</code> designer bio</li>
        <li><code>/skills</code> proficiency bars</li>
        <li><code>/board</code> projects board</li>
        <li><code>/config</code> config studio</li>
        <li><code>/export</code> export center</li>
        <li><code>/help</code> every command</li>
      </ul>
    </section>
  </div>
  <p class="welcome-hint">Type a command and press Enter. Try <code>/help</code>, a phrase like <code>show my work</code>, or Tab to autocomplete.</p>
</div>`;

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

const MODES = [
  { id: 'cli', label: 'CLI' },
  { id: 'board', label: 'Board' },
  { id: 'config', label: 'Config' },
  { id: 'export', label: 'Export' },
];

export default function Terminal({ onClose, minimized, setMinimized, maximized, setMaximized }) {
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const outputRef = useRef(null);
  const animated = useRef(new Set());
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [inputValue, setInputValue] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Boot typewriter: reveal BOOT_LINES progressively into local state so the
  // screen-reader log (outputBuffer) stays quiet during boot.
  const [typed, setTyped] = useState(() => (bootComplete.value ? BOOT_LINES.length : 0));
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  useEffect(() => {
    if (bootComplete.value) { setTyped(BOOT_LINES.length); return; }
    if (reducedMotion) { setTyped(BOOT_LINES.length); return; }
    if (typed >= BOOT_LINES.length) return;
    const line = BOOT_LINES[typed];
    if (charCount < line.text.length) {
      const t = setTimeout(() => setCharCount((c) => c + 1), 16);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setTyped((n) => n + 1); setCharCount(0); }, 140);
    return () => clearTimeout(t);
  }, [typed, charCount, reducedMotion]);

  const dismissBoot = () => {
    if (bootComplete.value) return;
    bootStep.value = BOOT_LINES.length;
    bootComplete.value = true;
    setTyped(BOOT_LINES.length);
    if (!welcomeShown.value) {
      welcomeShown.value = true;
      // Replace any prior welcome block, then it lives in the log.
      outputBuffer.value = [
        ...outputBuffer.value.filter((l) => l.view !== 'welcome'),
        { id: 'welcome-0', view: 'welcome', html: WELCOME_HTML },
      ];
    }
    lastMode.value = mode.value;
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // Animate newly appended output lines (stagger) + skill bars; respect RM.
  useLayoutEffect(() => {
    if (!outputRef.current) return;
    const fresh = outputRef.current.querySelectorAll('.output-line:not([data-anim])');
    if (fresh.length === 0) return;
    if (reducedMotion) {
      fresh.forEach((el) => el.setAttribute('data-anim', '1'));
    } else {
      gsap.fromTo(fresh, { opacity: 0, y: 8 }, {
        opacity: 1, y: 0, duration: 0.28, stagger: 0.04, ease: 'power2.out',
        onComplete: () => fresh.forEach((el) => el.setAttribute('data-anim', '1')),
      });
    }
    const bars = outputRef.current.querySelectorAll('.skill-fill:not([data-fill])');
    bars.forEach((bar) => {
      const prof = bar.getAttribute('data-prof') || '0';
      bar.setAttribute('data-fill', '1');
      if (reducedMotion) { bar.style.width = `${prof}%`; return; }
      gsap.fromTo(bar, { width: '0%' }, { width: `${prof}%`, duration: 0.7, ease: 'power2.out', delay: 0.1 });
    });
  }, [outputBuffer.value, reducedMotion]);

  useEffect(() => {
    if (bootComplete.value && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'end' });
    }
  }, [outputBuffer.value]);

  // Konami key sequence listener (global).
  useEffect(() => {
    let idx = 0;
    const onKey = (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === KONAMI[idx]) {
        idx += 1;
        if (idx === KONAMI.length) { easterEgg.value = 'confetti'; idx = 0; }
      } else if (key === KONAMI[0]) idx = 1; else idx = 0;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const completions = bootComplete.value ? getCompletions(inputValue) : [];
  useEffect(() => { setHighlight(0); }, [inputValue]);

  const applyCompletion = (c) => {
    const token = c.kind === 'project' ? c.token : c.token;
    setInputValue(token);
    setHighlight(0);
    if (inputRef.current) inputRef.current.value = token;
  };

  const runFromInput = (value) => {
    const v = (value ?? inputValue).trim();
    if (!v) return;
    commandHistory.value = [...commandHistory.value, v];
    // Typed command output belongs to the terminal log. Commands that intentionally
    // open another surface can still replace this mode from their own handler.
    mode.value = 'cli';
    processCommand(v);
    setInputValue('');
    if (inputRef.current) inputRef.current.value = '';
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (completions.length) { e.preventDefault(); setInputValue(''); if (inputRef.current) inputRef.current.value = ''; }
      return;
    }
    if ((e.key === 'Tab' || (e.key === 'Enter' && completions.length && highlight >= 0)) && completions.length) {
      e.preventDefault();
      const c = completions[Math.min(highlight, completions.length - 1)];
      if (e.key === 'Enter') { applyCompletion(c); runFromInput(c.token); }
      else applyCompletion(c);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      runFromInput();
      return;
    }
    if (e.key === 'ArrowDown' && completions.length) {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, completions.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      if (completions.length) { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); return; }
      e.preventDefault();
      if (commandHistory.value.length > 0) {
        const ni = historyIndex === -1 ? commandHistory.value.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(ni);
        const val = commandHistory.value[ni];
        setInputValue(val);
        if (inputRef.current) inputRef.current.value = val;
      }
      return;
    }
    if (e.key === 'ArrowDown' && !completions.length) {
      e.preventDefault();
      if (historyIndex !== -1) {
        const ni = historyIndex + 1;
        if (ni >= commandHistory.value.length) { setHistoryIndex(-1); setInputValue(''); if (inputRef.current) inputRef.current.value = ''; }
        else { setHistoryIndex(ni); const val = commandHistory.value[ni]; setInputValue(val); if (inputRef.current) inputRef.current.value = val; }
      }
    }
  };

  // Delegated clicks inside the rendered output (theme swatches, project cards).
  const handleOutputClick = (e) => {
    const swatch = e.target.closest('[data-theme-pick]');
    if (swatch) { theme.value = swatch.getAttribute('data-theme-pick'); return; }
    const card = e.target.closest('.cli-card[data-slug]');
    if (card) {
      const slug = card.getAttribute('data-slug');
      mode.value = 'cli';
      processCommand(slug);
      return;
    }
  };

  const onInputChange = (e) => { setInputValue(e.target.value); };

  const setMode = (id) => {
    if (id === 'config' && !['identity', 'skills', 'featured', 'profiles', 'diff'].includes(configTab.value)) {
      configTab.value = 'identity';
    }
    mode.value = id;
    lastMode.value = id;
  };

  return (
    <div
      className={`terminal-window h-full flex flex-col text-text-main font-mono text-xs sm:text-sm relative ${maximized ? 'is-max' : ''}`}
      onClick={() => { if (bootComplete.value) inputRef.current?.focus(); }}
    >
      <div className="titlebar">
        <div className="traffic-lights">
          <button type="button" className="tl tl-close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close terminal"><span className="dot dot-red" /></button>
          <button type="button" className="tl tl-min" onClick={(e) => { e.stopPropagation(); setMinimized((m) => !m); }} aria-label="Minimize terminal"><span className="dot dot-yellow" /></button>
          <button type="button" className="tl tl-max" onClick={(e) => { e.stopPropagation(); setMaximized((m) => !m); }} aria-label="Maximize terminal"><span className="dot dot-green" /></button>
        </div>
        <div className="titlebar-title" aria-hidden="true">designer@portfolio ~ /portfolio</div>
      </div>

      <div className="toolbar">
        <div className="mode-seg" role="group" aria-label="Interaction mode">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`mode-btn ${mode.value === m.id ? 'is-active' : ''}`}
              aria-pressed={mode.value === m.id}
              onClick={(e) => { e.stopPropagation(); setMode(m.id); }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="history-ctl">
          <button type="button" className="icon-btn" onClick={(e) => { e.stopPropagation(); undo(); }} disabled={!canUndo()} aria-label="Undo last change" title="Undo">
            <span className="icon-[tabler--arrow-back-up] size-4" />
          </button>
          <button type="button" className="icon-btn" onClick={(e) => { e.stopPropagation(); redo(); }} disabled={!canRedo()} aria-label="Redo last change" title="Redo">
            <span className="icon-[tabler--arrow-forward-up] size-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {!bootComplete.value ? (
            <div className="boot-pane" role="status" onClick={(e) => { e.stopPropagation(); dismissBoot(); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); dismissBoot(); } }} tabIndex={0} aria-label="Boot sequence. Press Enter to continue.">
              <div className="boot-lines">
                {BOOT_LINES.slice(0, typed).map((l, i) => (
                  <div key={i} className={`boot-line ${l.ok ? 'ok' : ''}`}>
                    {i === typed - 1 ? l.text.slice(0, charCount) : l.text}
                    {i === typed - 1 && charCount < l.text.length && <span className="caret">▋</span>}
                  </div>
                ))}
                {typed >= BOOT_LINES.length && (
                  <>
                    <div className="boot-line blank">&nbsp;</div>
                    <div className="boot-line accent">designer.portfolio v10.0 — ready.</div>
                    <div className="boot-line dim">Press Enter to continue...</div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              {mode.value === 'cli' ? (
                <div className="output-pane" ref={outputRef} role="log" aria-live="polite" aria-label="Terminal output" onClick={handleOutputClick}>
                  {outputBuffer.value.map((line) => (
                    line.html
                      ? <div key={line.id} className={`output-line ${line.type || ''}`} dangerouslySetInnerHTML={{ __html: line.html }} />
                      : line.socialHtml
                        ? <div key={line.id} className={`output-line ${line.type || ''}`} dangerouslySetInnerHTML={{ __html: line.socialHtml }} />
                        : <div key={line.id} className={`output-line ${line.type || ''}`}>{line.text}</div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              ) : (
                <div className="surface-pane">
                  <ModeSurface />
                </div>
              )}

              <div className="prompt-dock">
                {commandHistory.value.length > 0 && (
                  <div className="recent-chips" role="group" aria-label="Recent commands">
                    {commandHistory.value.slice(-5).reverse().map((cmd, idx) => (
                      <button key={idx} type="button" className="recent-chip" onClick={(e) => { e.stopPropagation(); setInputValue(cmd); if (inputRef.current) { inputRef.current.value = cmd; inputRef.current.focus(); } }} aria-label={`Reuse command ${cmd}`}>{cmd}</button>
                    ))}
                  </div>
                )}
                {completions.length > 0 && (
                  <ul className="autocomplete" role="listbox" aria-label="Command suggestions" id="prompt-listbox">
                    {completions.map((c, i) => (
                      <li
                        key={`${c.token}-${i}`}
                        role="option"
                        id={`ac-${i}`}
                        aria-selected={i === highlight}
                        className={`ac-row ${i === highlight ? 'is-active' : ''}`}
                        onMouseEnter={() => setHighlight(i)}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); applyCompletion(c); runFromInput(c.token); }}
                      >
                        <span className="ac-token">{c.label}</span>
                        <span className="ac-desc">{c.desc}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="prompt-row">
                  <span className="prompt-sign" aria-hidden="true">{'> '}</span>
                  <label className="sr-only" htmlFor="cmd-input">Command prompt</label>
                  <input
                    id="cmd-input"
                    ref={inputRef}
                    type="text"
                    className="prompt-input"
                    value={inputValue}
                    onInput={onInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder='Type a command… try "/help" or "show my work"'
                    autoComplete="off"
                    spellCheck="false"
                    aria-label="Command prompt"
                    aria-autocomplete="list"
                    aria-controls="prompt-listbox"
                    aria-activedescendant={completions.length ? `ac-${Math.min(highlight, completions.length - 1)}` : undefined}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// Lazy import to avoid a cycle at module top-level.
import Board from './Board.jsx';
import ConfigStudio from './ConfigStudio.jsx';
import ExportCenter from './ExportCenter.jsx';

function ModeSurface() {
  if (mode.value === 'board') return <Board />;
  if (mode.value === 'config') return <ConfigStudio />;
  if (mode.value === 'export') return <ExportCenter />;
  return null;
}
