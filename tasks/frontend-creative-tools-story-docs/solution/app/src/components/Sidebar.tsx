import React from 'react';
import { HelpCircle, Plus, FileText } from 'lucide-react';

export function Sidebar() {
  const storyboards = [
    { id: '1', title: '1. Getting Started', scenes: 8, active: true },
    { id: '2', title: '2. Create Your First Storyboard', scenes: 8, active: false },
    { id: '3', title: '3. Storyboard Like a Pro', scenes: 8, active: false },
  ];

  return (
    <nav className="w-64 bg-white border-r border-gray-200 h-full flex flex-col" aria-label="Sidebar">
      <div className="p-4 flex-1 overflow-y-auto">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Storyboards</h2>
        <ul className="space-y-1">
          {storyboards.map(board => (
            <li key={board.id}>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md inert-nav ${board.active ? 'bg-yellow-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                aria-label={board.title}
              >
                <FileText className="w-4 h-4" />
                <div className="text-left flex-1">
                  <div>{board.title}</div>
                  <div className="text-xs text-gray-500 font-normal">{board.scenes} Scenes</div>
                </div>
              </button>
            </li>
          ))}
        </ul>

        <button className="mt-6 flex items-center justify-center w-full gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 inert-nav" aria-label="Add Storyboard">
          <Plus className="w-4 h-4" />
          Add Storyboard
        </button>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 inert-nav" aria-label="Help">
          <HelpCircle className="w-5 h-5" />
          Help
        </button>
      </div>
    </nav>
  );
}
