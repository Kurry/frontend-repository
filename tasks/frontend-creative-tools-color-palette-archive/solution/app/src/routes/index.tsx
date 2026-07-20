import { component$, useContext } from '@builder.io/qwik';
import { GlobalStoreContext } from '../store';
import { LibraryHeader } from '../components/library/library-header';
import { Intro } from '../components/library/intro';
import { LibraryControls } from '../components/library/library-controls';
import { NomenclatureView } from '../components/library/nomenclature-view';
import { PaletteView } from '../components/library/palette-view';
import { SwatchView } from '../components/library/swatch-view';
import { DetailEditor } from '../components/library/detail-editor';
import { ExportDrawer } from '../components/library/export-drawer';
import { WebMCPBindings } from '../components/library/webmcp-bindings';
import { SubscribePopup } from '../components/library/popup';

export default component$(() => {
  const store = useContext(GlobalStoreContext);

  return (
    <>
      <WebMCPBindings />
      <div class="announcement-bar bg-black text-white text-center py-2 text-sm tracking-widest uppercase" aria-hidden="true">
        <span>Fine art color archives · historical naming · open dataset</span>
      </div>
      <LibraryHeader />
      <Intro />
      <section class="palette-library" id="PaletteLibrary">
        <LibraryControls />
        <div class="max-w-7xl mx-auto px-4 min-h-[50vh] pb-32">
          {store.palettes.length === 0 ? (
             <div class="text-center py-24 border-2 border-dashed border-gray-300">
               <p class="text-xl mb-4">No palettes found.</p>
               <button class="btn btn-outline rounded-none" onClick$={() => store.selectionId = 'new'}>Create Palette</button>
             </div>
          ) : (
            <>
              {store.activeView === 'nomenclature' && <NomenclatureView />}
              {store.activeView === 'palette' && <PaletteView />}
              {store.activeView === 'swatch' && <SwatchView />}
            </>
          )}
        </div>
      </section>

      <DetailEditor />
      <ExportDrawer />
      <SubscribePopup />

      <footer class="site-footer bg-[#16181b] text-[#fffaf0] py-16" data-parallax>
        <div class="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
           <div class="site-footer__col">
             <h4 class="font-bold uppercase tracking-widest text-xs mb-4 text-gray-400">Shop</h4>
             <ul class="flex flex-col gap-2">
               <li><button type="button" class="hover:underline text-sm">Shop All Art</button></li>
               <li><button type="button" class="hover:underline text-sm">New Arrivals</button></li>
             </ul>
           </div>
           <div class="site-footer__col">
             <h4 class="font-bold uppercase tracking-widest text-xs mb-4 text-gray-400">Info</h4>
             <ul class="flex flex-col gap-2">
               <li><button type="button" class="hover:underline text-sm">About Us</button></li>
               <li><button type="button" class="hover:underline text-sm">FAQ</button></li>
             </ul>
           </div>
        </div>
        <div class="max-w-7xl mx-auto px-4 mt-16 text-center text-4xl md:text-8xl font-serif text-gray-800" aria-hidden="true">
           Palette Library
        </div>
      </footer>
    </>
  );
});
