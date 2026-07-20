import React, { useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { StoryboardNav } from './StoryboardNav';
import { SceneGrid } from '../scene/SceneGrid';
import { NotificationsDrawer, AccountDrawer } from './Drawers';
import { ExportDrawer } from '../features/ExportDrawer';
import { CommandPalette } from '../features/CommandPalette';
import { ImportModal } from '../features/ImportModal';
import { Toast } from '../common/Toast';
import { isCommandPaletteOpenStore } from '@/store/ui';
import { initWebMCP } from '@/webmcp';

export function Workspace() {

  useEffect(() => {
    initWebMCP();

    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            isCommandPaletteOpenStore.set(true);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Header />
      <Sidebar />

      <main className="pt-14 lg:pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 storyboard-page">
            <StoryboardNav />
            <SceneGrid />
        </div>
      </main>

      <NotificationsDrawer />
      <AccountDrawer />
      <ExportDrawer />
      <ImportModal />
      <CommandPalette />
      <Toast />
    </div>
  );
}

export default Workspace;
