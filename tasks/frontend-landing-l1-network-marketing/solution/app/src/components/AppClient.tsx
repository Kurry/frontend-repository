import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $theme, $a11yStatus } from '../store';
import Header from './Header';
import Hero from './Hero';
import FeaturedInitiative from './FeaturedInitiative';
import WhyRidge from './WhyRidge';
import GetStarted from './GetStarted';
import LandingChapters from './LandingChapters';
import GlobalEvents from './GlobalEvents';
import EventsManager from './EventsManager';
import ContactForm from './ContactForm';
import SessionLeads from './SessionLeads';
import ExportCatalog from './ExportCatalog';
import MotionManager from './MotionManager';
import WebMCP from './WebMCP';

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
        <FeaturedInitiative />
        <WhyRidge />
        <GetStarted />
        <LandingChapters />
        <GlobalEvents />
        <ContactForm />
      </main>
      <footer>
        <SessionLeads />
        <div className="footer-band p-6 text-center text-sm opacity-70 border-t border-white/10">
          <p>Ridge network systems · Enterprise infrastructure for durable networks.</p>
        </div>
      </footer>
      <EventsManager />
      <ExportCatalog />
      {/* Persistent polite live region for cross-component announcements. */}
      <div aria-live="polite" role="status" className="sr-only" data-a11y-status>{a11yStatus}</div>
    </div>
  );
}
