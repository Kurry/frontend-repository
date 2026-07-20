import { component$ } from '@builder.io/qwik';

export const LibraryHeader = component$(() => {
  return (
    <header class="site-header fixed top-0 w-full bg-[#fffaf0] z-50 border-b border-gray-200" id="SiteHeader">
      <div class="site-header__inner max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <button type="button" class="site-header__logo inert-nav" aria-label="Palette Library">
          <span class="site-header__logo-script block text-4xl font-['Pinyon_Script']">Palette</span>
          <span class="site-header__logo-lockup block text-xs tracking-widest uppercase">THE PALETTE LIBRARY</span>
        </button>
        <div class="flex gap-4">
          <button type="button" class="site-header__menu inert-nav uppercase text-xs tracking-wide">Menu</button>
          <button type="button" class="site-header__cart inert-nav uppercase text-xs tracking-wide">Cart</button>
        </div>
      </div>
    </header>
  );
});
