import { useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { StoryboardNav } from './StoryboardNav';
import { SceneGrid } from '../scene/SceneGrid';
import { NotificationsDrawer, AccountDrawer } from './Drawers';
import { ExportDrawer } from '../features/ExportDrawer';
import { CommandPalette } from '../features/CommandPalette';
import { ImportModal } from '../features/ImportModal';
import { VersionHistoryPanel } from '../features/VersionHistoryPanel';
import { Toast } from '../common/Toast';
import { isCommandPaletteOpenStore } from '@/store/ui';
import { initWebMCP } from '@/webmcp';

export function Workspace() {
  useEffect(() => {
    initWebMCP();

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isCommandPaletteOpenStore.set(!isCommandPaletteOpenStore.get());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfdfa] text-gray-900">
      <a
        href="#scene-board"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-xl focus:bg-yellow-400 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-yellow-950"
      >
        Skip to scene board
      </a>

      <Header />
      <Sidebar />

      <main id="scene-board" className="min-h-screen pt-16 lg:pl-64">
        <div className="storyboard-page mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <StoryboardNav />
          <SceneGrid />
        </div>
      </main>

      <NotificationsDrawer />
      <AccountDrawer />
      <ExportDrawer />
      <ImportModal />
      <VersionHistoryPanel />
      <CommandPalette />
      <Toast />
    </div>
  );
}

export default Workspace;
