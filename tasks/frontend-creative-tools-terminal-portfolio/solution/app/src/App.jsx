import { useEffect, useState } from 'preact/hooks';
import { mode, theme, cookieConsent, outputBuffer } from './store.js';
import Terminal from './Terminal.jsx';
import Board from './Board.jsx';

export default function App() {
  const [terminalClosed, setTerminalClosed] = useState(false);

  useEffect(() => {
    document.documentElement.className = theme.value;
  }, [theme.value]);

  const handleAccept = () => cookieConsent.value = 'accepted';
  const handleDecline = () => cookieConsent.value = 'declined';

  const handleReopen = () => {
    setTerminalClosed(false);
  };

  return (
    <div className="min-h-screen flex flex-col p-2 md:p-8 bg-cover bg-center overflow-x-hidden" style={{ backgroundImage: 'url(/dark-theme-blur.webp)' }}>
      {cookieConsent.value === 'not_set' && (
        <div className="fixed bottom-0 sm:bottom-4 left-0 sm:left-auto right-0 sm:right-4 bg-base-200 p-4 rounded-t-lg sm:rounded-lg shadow-lg z-50 flex flex-col gap-2 border-t sm:border border-border">
          <p className="text-sm">We use cookies for analytics.</p>
          <div className="flex gap-2">
            <button onClick={handleAccept} className="btn btn-primary btn-sm flex-1 sm:flex-none" aria-label="Accept cookies">Accept</button>
            <button onClick={handleDecline} className="btn btn-ghost btn-sm flex-1 sm:flex-none" aria-label="Decline cookies">Decline</button>
          </div>
        </div>
      )}

      {terminalClosed ? (
        <div className="flex-1 flex items-center justify-center">
          <button onClick={handleReopen} className="btn btn-primary" aria-label="Reopen terminal">Reopen</button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full max-w-7xl mx-auto h-[95vh] md:h-[90vh]">
          <div className={`w-full ${mode.value === 'cli' ? 'lg:w-full' : 'lg:w-1/2'} flex flex-col transition-all duration-300 min-h-[400px]`}>
             <Terminal onClose={() => setTerminalClosed(true)} />
          </div>
          {mode.value !== 'cli' && (
            <div className="w-full lg:w-1/2 flex flex-col bg-panel-bg rounded-lg border border-border p-2 sm:p-4 overflow-y-auto min-h-[400px]">
               <Board />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
