import { createSignal, createEffect } from "solid-js";
import { Dialog } from "@kobalte/core/dialog";
import { store, setStore } from "./store";

export default function HelpPanel() {
  let triggerEl;
  const [shown, setShown] = createSignal(false);
  createEffect(() => {
    if (store.helpOpen) requestAnimationFrame(() => setShown(true));
    else setShown(false);
  });
  const restore = () => { if (!store.helpOpen) queueMicrotask(() => triggerEl?.focus()); };
  return (
    <Dialog open={store.helpOpen} onOpenChange={(o) => setStore("helpOpen", o)}>
      <Dialog.Trigger ref={triggerEl} class="w-9 h-9 flex items-center justify-center rounded-full bg-primary hover:bg-primary-soft text-white transition-colors shadow-lg" aria-label={store.helpOpen ? "Close exposure help" : "Open exposure help"}>
        <span class="font-display text-lg leading-none" aria-hidden="true">{store.helpOpen ? "✕" : "?"}</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-black/30" />
        <div class="fixed inset-0 z-50 flex justify-end pointer-events-none">
          <Dialog.Content class="help-panel pointer-events-auto w-full max-w-sm h-full bg-ink/95 backdrop-blur-xl border-l border-white/10 p-6 shadow-2xl overflow-y-auto" data-open={shown()} role="complementary" aria-label="Exposure help" onOpenAutoFocus={(e) => { e.preventDefault(); }} onCloseAutoFocus={(e) => { e.preventDefault(); restore(); }}>
            <div class="flex items-center justify-between mb-5">
              <Dialog.Title class="font-display text-xl uppercase tracking-widest">Exposure Help</Dialog.Title>
              <Dialog.CloseButton class="hover-wash w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center" aria-label="Close exposure help">✕</Dialog.CloseButton>
            </div>
            <Dialog.Description class="space-y-5 text-white/80 text-sm leading-relaxed">
              <p>
                <strong class="font-display uppercase tracking-wider text-white block mb-1">Aperture</strong>
                The lens opening, written as an f-number. A lower f-number (f/2.8) is a wider opening — more light and a shallower depth of field (softer background). A higher f-number (f/16) is a smaller opening — less light and more of the scene in focus.
              </p>
              <p>
                <strong class="font-display uppercase tracking-wider text-white block mb-1">Speed</strong>
                Shutter speed is how long the sensor is exposed, shown as 1/N of a second. Fast speeds (1/1000) freeze motion; slow speeds (1/2) stretch it into blur. Each step on the dial is one stop of light.
              </p>
              <p>
                <strong class="font-display uppercase tracking-wider text-white block mb-1">ISO</strong>
                The sensor's sensitivity to light. Low ISO (100) is clean; high ISO (3200) brightens dim scenes but adds visible grain. The histogram and EV readout update live as you move any dial.
              </p>
            </Dialog.Description>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
}
