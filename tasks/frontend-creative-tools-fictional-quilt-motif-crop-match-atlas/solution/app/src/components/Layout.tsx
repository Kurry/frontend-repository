import React, { ReactNode } from 'react';
import { useStore } from '../store/useStore';
import { Crop, Clock } from 'lucide-react';

export const Layout = ({ children }: { children: ReactNode }) => {
  const { logicalClock, resetSession } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b px-4 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <Crop className="w-5 h-5 text-primary" />
          <h1 className="font-bold text-lg hidden sm:block">Motif Crop-Match Atlas</h1>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{logicalClock.split('T')[1].replace('Z', '')}</span>
          </div>
          <button
            onClick={resetSession}
            className="px-3 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md transition-colors"
          >
            Reset
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 flex flex-col lg:flex-row gap-6">
        {children}
      </main>
    </div>
  );
};
