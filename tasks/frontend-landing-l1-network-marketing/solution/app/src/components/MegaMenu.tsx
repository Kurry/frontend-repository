import React, { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $megaMenuOpen } from '../store';

export default function MegaMenu() {
  const isOpen = useStore($megaMenuOpen);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        $megaMenuOpen.set(false);
        const hamburger = document.querySelector('.hamburger') as HTMLButtonElement;
        if (hamburger) hamburger.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const hamburger = document.querySelector('.hamburger');
        if (hamburger && hamburger.contains(e.target as Node)) return;
        $megaMenuOpen.set(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      // Trap focus roughly
      setTimeout(() => firstLinkRef.current?.focus(), 100);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm flex justify-end" aria-modal="true" role="dialog">
      <div
        ref={menuRef}
        className="bg-void text-white w-full max-w-md h-full p-8 shadow-2xl overflow-y-auto transform transition-transform duration-300 translate-x-0"
      >
        <div className="mt-16 flex flex-col gap-6">
          <h2 className="display-font text-2xl mb-4 border-b border-white/10 pb-2">Menu</h2>

          <nav className="flex flex-col gap-4 text-xl">
            <a ref={firstLinkRef} href="#build" className="hover:text-accent transition-colors focus-visible:outline focus-visible:outline-2" onClick={() => $megaMenuOpen.set(false)}>Build</a>
            <a href="#solutions" className="hover:text-accent transition-colors focus-visible:outline focus-visible:outline-2" onClick={() => $megaMenuOpen.set(false)}>Solutions</a>
            <a href="#community" className="hover:text-accent transition-colors focus-visible:outline focus-visible:outline-2" onClick={() => $megaMenuOpen.set(false)}>Community</a>
            <a href="#about" className="hover:text-accent transition-colors focus-visible:outline focus-visible:outline-2" onClick={() => $megaMenuOpen.set(false)}>About</a>
          </nav>

          <div className="mt-8 p-6 bg-surface/10 rounded-xl notch-br border border-white/10">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Featured News</p>
            <h3 className="font-semibold text-lg mb-2">Ridge Network Upgrade</h3>
            <p className="text-sm text-gray-300 mb-4">Learn about the latest protocol improvements.</p>
            <button type="button" className="btn btn-sm btn-primary notch-br">Read more</button>
          </div>
        </div>
      </div>
    </div>
  );
}
