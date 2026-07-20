import { ReactNode } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setTab } from '../store/themeSlice';

export default function Shell({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const tab = useSelector((state: RootState) => state.theme.tab);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Material UI Theme Creator</h1>
          <div className="flex items-center text-sm text-gray-400">
            <span className="mr-2">└─</span>
            <button type="button" className="px-2 py-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 cursor-not-allowed" title="@material-ui/core">
              @material-ui/core@^4.11.0
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="px-3 py-1.5 text-sm font-medium text-blue-400 hover:bg-blue-400/10 rounded transition-colors" id="btn-tutorial">
            Tutorial
          </button>
          <button type="button" className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors cursor-not-allowed" aria-label="GitHub" title="GitHub">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85.004 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.58.69.48A10.27 10.27 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"/>
            </svg>
          </button>
        </div>
      </header>

      <nav className="flex px-4 border-b border-gray-700 bg-gray-900" role="tablist" aria-label="Main">
        <div className="flex items-center mr-6" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path fill="#00b0ff" d="M19.37 2.04l-9 2.25a1 1 0 0 0-.74.97v10.9a2.5 2.5 0 1 0 1.5 2.3V9.54l7.5-1.87v7.24a2.5 2.5 0 1 0 1.5 2.3V3a1 1 0 0 0-1.26-.96z"/>
          </svg>
        </div>
        {(['preview', 'components', 'saved', 'export'] as const).map(t => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => dispatch(setTab(t))}
            className={`px-4 py-3 text-sm font-medium transition-colors relative outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:z-10 min-w-11 min-h-11 ${
              tab === t ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {t === 'preview' ? 'Preview' : t === 'components' ? 'Components' : t === 'saved' ? 'Saved Themes' : 'Export'}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
            )}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
