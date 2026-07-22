import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './store';
import Layout from './components/Layout';
import Header from './components/Header';
import TestList from './components/TestList';
import ReplayTimeline from './components/ReplayTimeline';
import Summary from './components/Summary';
import './webmcp';

function AppContent() {
  const { dispatch } = useStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        dispatch({ type: 'UNDO' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  return (
    <Layout
      header={<Header />}
      sidebar={<TestList />}
      timeline={<ReplayTimeline />}
      summary={<Summary />}
    />
  );
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
