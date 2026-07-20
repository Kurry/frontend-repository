import { useEffect } from 'react';
import { Button, Group, Text } from '@mantine/core';
import { IconHome, IconRosetteDiscountCheck } from '@tabler/icons-react';
import { ArtifactButtons, ArtifactDrawers } from './components/ArtifactDrawers';
import Portfolio from './components/Portfolio';
import Workspace from './components/Workspace';
import { useReviewStore } from './store';
import { registerWebMCP } from './webmcp';

export default function App() {
  const view = useReviewStore((state) => state.ui.view);
  const announcement = useReviewStore((state) => state.ui.announcement);
  const openPortfolio = useReviewStore((state) => state.openPortfolio);
  useEffect(() => registerWebMCP(), []);
  return (
    <div className="app-frame">
      <header className="app-topbar">
        <button type="button" className="brand" onClick={openPortfolio} aria-label="Open benchmark certification portfolio">
          <span className="brand-mark"><IconRosetteDiscountCheck size={22} /></span>
          <span><strong>Benchmark Certification</strong><small>Evidence review workbench</small></span>
        </button>
        <div className="topbar-actions"><Button className="home-control" variant="subtle" leftSection={<IconHome size={16} />} onClick={openPortfolio}>Portfolio</Button><ArtifactButtons /></div>
      </header>
      {view === 'portfolio' ? <Portfolio /> : <Workspace />}
      <ArtifactDrawers />
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
      <footer className="app-footer"><Text size="xs">In-memory certification session · page reload restores the 12-bundle seed baseline</Text><Text size="xs">Sable-4 / Quartz-Mini evidence model</Text></footer>
    </div>
  );
}
