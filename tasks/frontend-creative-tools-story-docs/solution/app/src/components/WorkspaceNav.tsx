import React from 'react';
import { useStore } from '@nanostores/react';
import { viewModeStore, ViewMode } from '../store';
import { LayoutGrid, List, MonitorPlay, MousePointer2 } from 'lucide-react';

export function WorkspaceNav() {
  const currentMode = useStore(viewModeStore);

  const modes: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
    { id: 'tile', icon: <LayoutGrid className="w-4 h-4" />, label: 'Tile mode' },
    { id: 'list', icon: <List className="w-4 h-4" />, label: 'List mode' },
    { id: 'slide', icon: <MonitorPlay className="w-4 h-4" />, label: 'Slide mode' },
    { id: 'canvas', icon: <MousePointer2 className="w-4 h-4" />, label: 'Canvas mode' }
  ];

  return (
    <div className="flex items-center justify-between py-4 px-6 border-b border-gray-200 bg-white" aria-label="Storyboard Nav">
      <div className="flex items-center">
        {/* Templates can go here */}
      </div>

      <div className="flex bg-gray-100 rounded-lg p-1">
        {modes.map(mode => (
          <button
            key={mode.id}
            className={`p-2 rounded-md transition-colors ${currentMode === mode.id ? 'bg-white shadow-sm' : 'hover:bg-gray-200 text-gray-500'}`}
            onClick={() => viewModeStore.set(mode.id)}
            aria-pressed={currentMode === mode.id}
            aria-label={mode.label}
            role="button"
          >
            {mode.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
