import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $theme, $a11yStatus } from '../store';
import Header from './Header';
import Hero from './Hero';
import WhyRidge from './WhyRidge';
import GetStarted from './GetStarted';
import GlobalEvents from './GlobalEvents';
import EventsManager from './EventsManager';
import ContactForm from './ContactForm';
import SessionLeads from './SessionLeads';
import ExportCatalog from './ExportCatalog';
import MotionManager from './MotionManager';
import WebMCP from './WebMCP';
import { TrustStrip, DeveloperResources, NetworkInAction, NewsStories, SolutionsGrid, CommunityBlock } from './MockBlocks';

export default function AppClient() {
  const theme = useStore($theme);
  const a11yStatus = useStore($a11yStatus);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="void text-current relative">
      <WebMCP />
      <MotionManager />
      <Header />
      <main>
        <Hero />
        <WhyRidge />
        <GetStarted />
        <TrustStrip />
        <DeveloperResources />
        <NetworkInAction />
        <NewsStories />
        <SolutionsGrid />
        <CommunityBlock />
        <GlobalEvents />
        <ContactForm />
      </main>
      <footer>
        <SessionLeads />
        <div className="footer-band p-6 text-center text-sm text-gray-500 border-t border-white/5">
          <p>Shape &amp; motion lab · placeholders only</p>
        </div>
      </footer>
      <EventsManager />
      <ExportCatalog />
      {/* Persistent polite live region for cross-component announcements. */}
      <div aria-live="polite" role="status" className="sr-only" data-a11y-status>{a11yStatus}</div>
    </div>
  );
}
