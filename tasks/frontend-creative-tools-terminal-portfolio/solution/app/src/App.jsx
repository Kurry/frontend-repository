import { useState } from 'preact/hooks';
import { useSignalEffect } from '@preact/signals';
import { mode, theme, cookieConsent, easterEgg } from './store.js';
import Terminal from './Terminal.jsx';
import EasterCanvas from './EasterCanvas.jsx';
import wallpaperUrl from '../dark-theme-blur.webp';

// Map our four themes onto daisyUI built-in themes so component chrome
// (buttons, badges, cards) recolors coherently alongside our design tokens.
const DAISY_THEME = { dark: 'dark', light: 'light', retro: 'retro', glass: 'dim' };

export default function App() {
  const [terminalClosed, setTerminalClosed] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  useSignalEffect(() => {
    const t = theme.value;
    const root = document.documentElement;
    root.className = `theme-${t}`;
    root.dataset.theme = DAISY_THEME[t] || t;
  });

  const accept = () => { cookieConsent.value = 'accepted'; };
  const decline = () => { cookieConsent.value = 'declined'; };
  const reopen = () => { setTerminalClosed(false); setMinimized(false); };

  return (
    <main className="app-shell" aria-label="Terminal portfolio workspace" style={{ backgroundImage: `url(${wallpaperUrl})` }}>
      <EasterCanvas kind={easterEgg.value} onDone={() => { easterEgg.value = null; }} />

      {cookieConsent.value === 'not_set' && (
        <div className="consent-banner" role="dialog" aria-label="Cookie consent">
          <p className="consent-text">This portfolio uses no cookies or tracking. Dismiss this notice to record your choice for the session.</p>
          <div className="consent-actions">
            <button type="button" className="btn btn-primary consent-btn" onClick={accept}>Accept</button>
            <button type="button" className="btn btn-ghost consent-btn" onClick={decline}>Decline</button>
          </div>
        </div>
      )}

      {terminalClosed ? (
        <div className="exit-overlay" role="dialog" aria-label="Terminal closed">
          <div className="exit-card">
            <span className="icon-[tabler--terminal-2] size-8 exit-icon" aria-hidden="true" />
            <h2 className="exit-h">Session paused</h2>
            <p className="exit-p">The terminal window is closed. Your output history and theme are preserved in memory for this tab.</p>
            <button type="button" className="btn btn-primary exit-reopen" onClick={reopen} autoFocus>Reopen Terminal</button>
          </div>
        </div>
      ) : (
        <div className={`terminal-wrap ${maximized ? 'is-max' : ''}`}>
          <Terminal
            onClose={() => setTerminalClosed(true)}
            minimized={minimized}
            setMinimized={setMinimized}
            maximized={maximized}
            setMaximized={setMaximized}
          />
        </div>
      )}
    </main>
  );
}
