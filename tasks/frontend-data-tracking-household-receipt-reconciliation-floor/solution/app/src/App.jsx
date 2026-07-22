import React, { useState } from 'react';
import Canvas from './components/Canvas';
import BudgetMatrix from './components/BudgetMatrix';
import SplitRules from './components/SplitRules';
import Matching from './components/Matching';
import Graph from './components/Graph';
import Settlement from './components/Settlement';
import Review from './components/Review';
import Layout from './components/Layout';
import { useStore } from './store';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('canvas');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'canvas' && <Canvas />}
        {activeTab === 'rules' && <SplitRules />}
        {activeTab === 'matching' && <Matching />}
        {activeTab === 'budget' && <BudgetMatrix />}
        {activeTab === 'graph' && <Graph />}
        {activeTab === 'settlement' && <Settlement />}
        {activeTab === 'review' && <Review />}
      </div>
    </Layout>
  );
}

export default App;
