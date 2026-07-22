import React, { useEffect } from 'react';
import { useStore } from '../store';
import { CollectionList } from './CollectionList';
import { ScenarioWeaver } from './ScenarioWeaver';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  const { undoLastMutation } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undoLastMutation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLastMutation]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-text-main">
      <Sidebar />
      <main className="flex-1 flex flex-col md:flex-row min-w-0">
        <section className="flex-1 flex flex-col min-w-0 border-r border-border bg-surface">
          <header className="p-4 border-b border-border bg-background">
            <h1 className="text-xl font-bold text-primary-dark">Brew Experiments</h1>
          </header>
          <div className="flex-1 overflow-auto p-4">
            <CollectionList />
          </div>
        </section>

        <aside className="w-full md:w-96 flex-shrink-0 bg-secondary flex flex-col shadow-lg border-l border-border md:relative absolute inset-y-0 right-0 transform transition-transform md:translate-x-0 z-10">
          <ScenarioWeaver />
        </aside>
      </main>
    </div>
  );
};
