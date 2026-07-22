import React, { useEffect } from 'react';
import { SpeakerSlots } from './components/SpeakerSlots';
import { BatchReconciler } from './components/BatchReconciler';
import { ExportImport } from './components/ExportImport';
import { registerWebMCPTools } from './webmcp';

const App: React.FC = () => {
  useEffect(() => {
    registerWebMCPTools();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <SpeakerSlots />
        </div>
        <div className="w-full md:w-80 flex flex-col gap-6">
          <BatchReconciler />
          <ExportImport />
        </div>
      </div>
    </div>
  );
};

export default App;
