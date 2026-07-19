import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import BoardSwitcher from './components/BoardSwitcher';
import SearchBar from './components/SearchBar';
import SelectionControls from './components/SelectionControls';
import ExportModal from './components/ExportModal';
import OutlineView from './components/OutlineView';
import LivePanel from './components/LivePanel';
import { useAppDispatch, useAppSelector } from './hooks';
import { streamTick } from './slices/appSlice';

const InnerApp: React.FC = () => {
  const dispatch = useAppDispatch();
  const canvasView = useAppSelector(s => s.app.canvasView);
  const viewMode = useAppSelector(s => s.app.viewMode);
  const showLivePanel = useAppSelector(s => s.app.showLivePanel);
  const streamStatus = useAppSelector(s => s.app.stream.status);
  const statusMessage = useAppSelector(s => s.app.statusMessage);
  const boards = useAppSelector(s => s.app.boards);
  const activeBoardId = useAppSelector(s => s.app.activeBoardId);
  const objectCount = boards.find(b => b.id === activeBoardId)?.objects.length || 0;

  const mainRef = useRef<HTMLElement>(null);
  const [mainSize, setMainSize] = useState({ width: 1024, height: 640 });

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const update = () => {
      setMainSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Deterministic local event stream ticker
  useEffect(() => {
    if (streamStatus !== 'active' && streamStatus !== 'disconnected') return;
    const interval = window.setInterval(() => {
      dispatch(streamTick());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [streamStatus, dispatch]);

  const canvasCenter = useMemo(
    () => ({
      x: (-canvasView.panX + mainSize.width / 2) / canvasView.zoom,
      y: (-canvasView.panY + mainSize.height / 2) / canvasView.zoom,
    }),
    [canvasView, mainSize]
  );

  return (
    <div className="app-shell flex flex-col w-full" style={{ height: '100vh', minHeight: '480px' }}>
      <header
        className="app-header flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 bg-white/95 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)', zIndex: 30 }}
      >
        <h1
          className="font-bold tracking-tight m-0 whitespace-nowrap"
          style={{ fontSize: '18px', color: 'var(--color-primary)' }}
        >
          ScribbleSpace
        </h1>
        <BoardSwitcher />
        <div className="app-search sm:ml-auto min-w-0">
          <SearchBar />
        </div>
      </header>

      <div className="app-actions flex flex-col gap-2 px-3 py-2 flex-shrink-0" style={{ zIndex: 20 }}>
        <Toolbar canvasCenter={canvasCenter} />
        <SelectionControls />
      </div>

      <main ref={mainRef} className="flex-1 relative overflow-hidden" style={{ minHeight: '280px' }}>
        {viewMode === 'canvas' ? (
          <Canvas width={mainSize.width} height={mainSize.height} />
        ) : (
          <OutlineView />
        )}
        {showLivePanel && <LivePanel />}
      </main>

      <footer
        className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 bg-white/95 flex-shrink-0"
        style={{ borderTop: '1px solid var(--color-border)', minHeight: 32 }}
      >
        <span className="font-medium" style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {objectCount === 1 ? '1 object' : `${objectCount} objects`}
        </span>
        <span
          role="status"
          aria-live="polite"
          className="font-medium truncate"
          style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}
        >
          {statusMessage.text}
        </span>
      </footer>

      <ExportModal />
    </div>
  );
};

const App: React.FC = () => (
  <Provider store={store}>
    <InnerApp />
  </Provider>
);

export default App;
