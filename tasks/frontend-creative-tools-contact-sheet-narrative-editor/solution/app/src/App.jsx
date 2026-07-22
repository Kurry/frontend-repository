import React from 'react';
import { ContactSheet } from './components/ContactSheet.jsx';
import { CompareLoupe } from './components/CompareLoupe.jsx';
import { SequenceBuilder } from './components/SequenceBuilder.jsx';
import { ReviewSidebar } from './components/ReviewSidebar.jsx';

function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden text-sm">
      <header className="bg-gray-900 text-white p-3 flex justify-between items-center">
        <h1 className="font-bold text-lg tracking-tight">Contact Sheet Narrative Editor</h1>
        <div className="text-xs text-gray-400">River Market Morning</div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ContactSheet />
        <CompareLoupe />
        <ReviewSidebar />
      </div>

      <SequenceBuilder />
    </div>
  );
}

export default App;
