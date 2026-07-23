import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $megaMenuOpen } from '../store';
import { ArrowRight, X } from 'phosphor-react';

const PANELS = [
  { label: 'Build', title: 'Build on Ridge', copy: 'Move from architecture review to production deployment with local-first technical guidance.', cta: 'Explore developer resources', target: 'developer-resources' },
  { label: 'Solutions', title: 'Infrastructure for real outcomes', copy: 'Design regulated assets, enterprise data rails, and globally distributed applications.', cta: 'View solutions', target: 'solutions' },
  { label: 'Community', title: 'Operate with the ecosystem', copy: 'Meet validators, founders, and developers sharing production lessons across Ridge.', cta: 'Join the community', target: 'community' },
  { label: 'About', title: 'Durable networks by design', copy: 'Learn how Ridge combines institutional controls, interoperability, and high-throughput execution.', cta: 'See global events', target: 'events' },
] as const;

export default function MegaMenu() {
  const isOpen = useStore($megaMenuOpen);
  const [closing, setClosing] = useState(false);
  const [activePanel, setActivePanel] = useState<(typeof PANELS)[number]['label']>('Build');
  const menuRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const visible = isOpen || closing;

  const focusHamburger = () => {
    const hamburger = document.querySelector('.hamburger') as HTMLButtonElement | null;
    hamburger?.focus({ preventScroll: true });
  };

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => {
      $megaMenuOpen.set(false);
      setClosing(false);
      // Restore after the drawer unmounts. Focusing during a backdrop
      // mousedown is immediately overwritten by the browser's click focus.
      window.requestAnimationFrame(focusHamburger);
    }, 220);
  };

  useEffect(() => {
    if (!isOpen) return;
    setActivePanel('Build');
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); requestClose(); } };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const hamburger = document.querySelector('.hamburger');
        if (hamburger && hamburger.contains(e.target as Node)) return;
        requestClose();
      }
    };
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !menuRef.current) return;
      const f = Array.from(menuRef.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.hasAttribute('disabled'));
      if (f.length === 0) return;
      const first = f[0], last = f[f.length - 1];
      const active = document.activeElement as HTMLElement;
      if (e.shiftKey && (active === first || !menuRef.current.contains(active))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('keydown', handleTab);
    document.addEventListener('mousedown', handleClickOutside);
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 60);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('keydown', handleTab);
      document.removeEventListener('mousedown', handleClickOutside);
      window.clearTimeout(t);
    };
  }, [isOpen, closing]);

  if (!visible) return null;
  const panel = PANELS.find(item => item.label === activePanel) ?? PANELS[0];

  const jumpTo = (target: string) => {
    requestClose();
    window.setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }), 240);
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 top-[81px] z-[39] md:inset-0 md:top-0 md:z-[50] bg-black/50 backdrop-blur-sm flex justify-end ${closing ? 'backdrop-out' : 'backdrop-in'}`}
      aria-modal="true"
      role="dialog"
      aria-label="Site menu"
      onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose(); }}
    >
      <div
        ref={menuRef}
        className={`bg-void text-white w-full md:max-w-md h-full p-8 shadow-2xl overflow-y-auto ${closing ? 'drawer-out' : 'drawer-in'}`}
      >
        <div className="mt-4 flex justify-end">
          <button ref={closeBtnRef} type="button" className="btn btn-square border border-white/25 bg-transparent text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={requestClose} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-col gap-6">
          <h2 className="display-font text-2xl mb-2 border-b border-white/10 pb-2">Menu</h2>

          <nav aria-label="Mega menu" role="tablist" className="grid grid-cols-2 gap-2 text-base">
            {PANELS.map(({ label }) => (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={activePanel === label}
                aria-controls="mega-menu-panel"
                className={`text-left px-4 py-3 notch-br border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${activePanel === label ? 'border-accent text-accent bg-accent/10' : 'border-white/10 hover:border-accent/60 hover:text-accent'}`}
                onClick={() => setActivePanel(label)}
              >
                {label}
              </button>
            ))}
          </nav>

          <section id="mega-menu-panel" role="tabpanel" aria-label={`${panel.label} panel`} className="mt-2 p-6 bg-surface/10 rounded-xl notch-br border border-white/10 panel-in">
            <p className="text-sm text-accent uppercase tracking-widest mb-2">{panel.label}</p>
            <h3 className="font-semibold text-2xl mb-3">{panel.title}</h3>
            <p className="text-sm opacity-75 mb-5">{panel.copy}</p>
            <button type="button" className="cta btn btn-sm btn-primary notch-br gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => jumpTo(panel.target)}>
              {panel.cta} <ArrowRight size={15} aria-hidden="true" />
            </button>
          </section>

          <div className="p-6 bg-surface/10 rounded-xl notch-br border border-white/10">
            <p className="text-sm opacity-65 uppercase tracking-widest mb-2">Featured news</p>
            <h3 className="font-semibold text-lg mb-2">Ridge network upgrade</h3>
            <p className="text-sm opacity-75 mb-4">Review the latest reliability and protocol improvements.</p>
            <button type="button" className="btn btn-sm btn-outline notch-br text-white border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => jumpTo('news-stories')}>Read network update</button>
          </div>
        </div>
      </div>
    </div>
  );
}
