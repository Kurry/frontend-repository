import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $theme } from '../store';
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

export default function AppClient() {
  const theme = useStore($theme);

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
        <GlobalEvents />
        <ContactForm />
      </main>
      <footer>
        <SessionLeads />
        <div className="footer-band p-6 text-center text-sm text-gray-500 border-t border-white/5">
          <p>Ridge L1 · Institutional infrastructure for the open network</p>
        </div>
      </footer>
      <EventsManager />
      <ExportCatalog />
    </div>
  );
}
