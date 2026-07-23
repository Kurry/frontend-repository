import React from 'react';
import { Layout } from './components/Layout';
import { StudyCanvas } from './components/StudyCanvas';
import { ResultGrid } from './components/ResultGrid';
import { TransformRibbon } from './components/TransformRibbon';
import { SimilarityScatter } from './components/SimilarityScatter';
import { OverlayLoupe } from './components/OverlayLoupe';
import { Modals } from './components/Modals';

function App() {
  return (
    <Layout>
      <div className="w-full lg:w-2/5 flex flex-col gap-4">
        <StudyCanvas />
        <SimilarityScatter />
      </div>

      <div className="w-full lg:w-1/4 h-[400px] lg:h-auto">
        <ResultGrid />
      </div>

      <div className="w-full lg:w-[35%] flex flex-col gap-4">
        <OverlayLoupe />
        <TransformRibbon />
      </div>

      <Modals />
    </Layout>
  );
}

export default App;
