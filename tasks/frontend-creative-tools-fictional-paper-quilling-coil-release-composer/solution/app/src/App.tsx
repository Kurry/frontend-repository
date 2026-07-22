import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { Board } from './components/Board';
import { exportSamplePacket } from './lib/export';
import { registerWebMCP } from './lib/webmcp';
import { PlaywrightTest } from './components/PlaywrightTest';
import { RadialProfile } from './components/RadialProfile';
import { SampledVertexTable } from './components/Table';
import { Timeline } from './components/Timeline'; // optional helper

export default function App() {
   const { initializeFixture, projects, activeProjectId, createDecision, addAnnotation } = useStore();

   useEffect(() => {
      initializeFixture();
      registerWebMCP();
   }, []);

   if (!activeProjectId) {
      return <div>Loading fixture...</div>;
   }

   const project = projects.find(p => p.id === activeProjectId);

   return (
      <div className="flex flex-col p-4 w-full h-full min-h-screen font-sans">
         <h1 className="text-2xl font-bold mb-4">{project?.title} - Paper Quilling Composer</h1>

         <div className="flex gap-4">
            <Board />

            <div className="flex flex-col gap-4">
               <div className="p-4 border shadow rounded">
                  <h2 className="font-bold mb-2">Decisions & Review</h2>
                  <button onClick={() => {
                     createDecision({
                        parentDecisionId: null,
                        status: 'working',
                        rationale: 'the exact tangent closes the haven bloom without spending another strip',
                        confidence: 'working',
                        sourceIds: ['strip-coral-r2', 'motif-haven-bloom-r4'],
                        curveHash: 'mock', contactHash: 'mock', motifHash: 'mock', metricsHash: 'mock'
                     });
                  }} className="block w-full px-2 py-1 bg-green-200 mb-2">
                     Prefer "Open Contact" Layout
                  </button>
                  <button onClick={() => {
                     addAnnotation({
                        targetId: 'contact-coil-07-coil-12',
                        targetType: 'contact',
                        text: 'retain this exact tangent in the sample card'
                     });
                  }} className="block w-full px-2 py-1 bg-yellow-200 mb-2">
                     Annotate tangent
                  </button>
                  <button onClick={async () => {
                     await exportSamplePacket();
                  }} className="block w-full px-2 py-1 bg-blue-600 text-white font-bold">
                     Export Packet
                  </button>
               </div>

               <RadialProfile />
               <SampledVertexTable />
               <Timeline />
               <PlaywrightTest />
            </div>
         </div>
      </div>
   );
}
