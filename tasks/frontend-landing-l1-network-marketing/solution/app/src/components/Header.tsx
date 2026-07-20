import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $theme, $megaMenuOpen, $commandPaletteOpen } from '../store';
import { List, X, Moon, Sun, MagnifyingGlass } from 'phosphor-react';
import MegaMenu from './MegaMenu';
import CommandPalette from './CommandPalette';

export default function Header() {
  const theme = useStore($theme);
  const megaMenuOpen = useStore($megaMenuOpen);

  const toggleTheme = () => {
    $theme.set(theme === 'light' ? 'dark' : 'light');
  };

  const toggleMenu = () => {
    $megaMenuOpen.set(!megaMenuOpen);
  };

  const openCmd = () => {
    $commandPaletteOpen.set(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        $commandPaletteOpen.set(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header id="chrome" className="sticky top-0 z-40 load-target w-full translate-y-0 transition-transform duration-500 ease-out">
        <div className="flex justify-between items-center p-4 bg-surface/80 backdrop-blur-md notch-br shadow-sm border-b border-white/10">
          <div className="flex items-center gap-2" id="marketing-home">
            <span className="w-6 h-6 bg-accent rounded-sm inline-block" aria-hidden="true"></span>
            <span className="font-bold text-xl tracking-wide lowercase display-font">ridge</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-ghost btn-circle text-current"
              onClick={openCmd}
              aria-label="Command Palette"
            >
              <MagnifyingGlass size={20} />
            </button>
            <button
              type="button"
              className="theme-pill btn btn-sm btn-outline rounded-full w-12 flex items-center justify-center p-0 overflow-hidden"
              id="themeToggle"
              aria-label={`Current theme: ${theme}. Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              onClick={toggleTheme}
            >
               {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              type="button"
              className="hamburger btn btn-sm btn-square notch-br bg-void text-white hover:bg-void/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label="Menu"
              aria-expanded={megaMenuOpen}
              onClick={toggleMenu}
            >
              {megaMenuOpen ? <X size={20} /> : <List size={20} />}
            </button>
          </div>
        </div>
      </header>
      <MegaMenu />
      <CommandPalette />
    </>
  );
}
