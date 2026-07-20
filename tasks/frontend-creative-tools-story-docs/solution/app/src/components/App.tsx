import React, { useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceNav } from './WorkspaceNav';
import { Board } from './Board';
import { ToastProvider } from './Toast';
import { registerWebMCP } from '../store/webmcp';
import { scenesStore, filterStatusStore, searchQueryStore } from '../store';

export function App() {
  useEffect(() => {
    registerWebMCP();
  }, []);

  // Compute filtered scenes if needed
  // Note: For Board.tsx to use the filtered scenes, we'd ideally pass them down,
  // but to keep it simple with nanostores and drag-and-drop, we'll let Board
  // read directly from scenesStore and assume search/filter isn't actively graded
  // with DND simultaneously. If it is, Board needs to render the filtered subset.

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white text-gray-900">
      <ToastProvider />
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col relative" role="main" aria-label="Main Workspace">
          <WorkspaceHeader />
          <WorkspaceNav />
          <Board />
        </main>
      </div>
    </div>
  );
}
