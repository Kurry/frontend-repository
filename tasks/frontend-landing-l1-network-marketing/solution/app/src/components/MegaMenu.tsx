import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $megaMenuOpen } from '../store';
import { X } from 'phosphor-react';

const PANELS = ['Build', 'Solutions', 'Community', 'About'];

export default function MegaMenu() {
  const isOpen = useStore($megaMenuOpen);
  const [closing, setClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const visible = isOpen || closing;

  const focusHamburger = () => {
    const hamburger = document.querySelector('.hamburger') as HTMLButtonElement | null;
    hamburger?.focus();
  };

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => {
      $megaMenuOpen.set(false);
      setClosing(false);
      focusHamburger();
    }, 220);
  };

  useEffect(() => {
    if (!isOpen) return;
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

  return (
    <div
      className={`fixed inset-0 z-[50] bg-black/50 backdrop-blur-sm flex justify-end ${closing ? 'backdrop-out' : 'backdrop-in'}`}
      aria-modal="true"
      role="dialog"
      aria-label="Site menu"
      onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose(); }}
    >
      <div
        ref={menuRef}
        className={`bg-void text-white w-full max-w-md h-full p-8 shadow-2xl overflow-y-auto ${closing ? 'drawer-out' : 'drawer-in'}`}
      >
        <div className="mt-4 flex justify-end">
          <button ref={closeBtnRef} type="button" className="btn btn-ghost btn-square text-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={requestClose} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-col gap-6">
          <h2 className="display-font text-2xl mb-2 border-b border-white/10 pb-2">Menu</h2>

          <nav aria-label="Mega menu" className="flex flex-col gap-4 text-xl">
            {PANELS.map((label) => (
              <button
                key={label}
                type="button"
                className="text-left hover:text-accent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
                onClick={requestClose}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-4 p-6 bg-surface/10 rounded-xl notch-br border border-white/10">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Featured News</p>
            <h3 className="font-semibold text-lg mb-2">Ridge Network Upgrade</h3>
            <p className="text-sm text-gray-300 mb-4">Learn about the latest protocol improvements.</p>
            <button type="button" className="btn btn-sm btn-primary notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={requestClose}>Read more</button>
          </div>
        </div>
      </div>
    </div>
  );
}
