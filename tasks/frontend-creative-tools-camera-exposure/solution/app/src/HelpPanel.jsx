import { Dialog } from "@kobalte/core/dialog";
import { store, setStore } from './store';
import PhQuestion from '~icons/ph/question';
import PhX from '~icons/ph/x';

function HelpPanel() {
  let closeButton;

  return (
    <Dialog open={store.helpOpen} onOpenChange={(isOpen) => {
      setStore('helpOpen', isOpen);
    }}>
      <Dialog.Trigger class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none" aria-label="Toggle exposure help">
        {store.helpOpen ? <PhX /> : <PhQuestion />}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-black/20 data-[expanded]:animate-in data-[closed]:animate-out data-[expanded]:fade-in data-[closed]:fade-out" />
        <div class="fixed inset-0 z-50 flex justify-end">
          <Dialog.Content
            class="w-full max-w-sm h-full bg-gray-900 border-l border-gray-800 p-6 shadow-2xl overflow-y-auto data-[expanded]:animate-in data-[closed]:animate-out data-[expanded]:slide-in-from-right-full data-[closed]:slide-out-to-right-full duration-300 motion-reduce:transition-none motion-reduce:animate-none"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              queueMicrotask(() => closeButton?.focus());
            }}
          >
            <div class="flex items-center justify-between mb-6">
              <Dialog.Title class="text-xl font-bold">Exposure Help</Dialog.Title>
              <Dialog.CloseButton ref={closeButton} class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors" aria-label="Close exposure help">
                <PhX />
              </Dialog.CloseButton>
            </div>
            <Dialog.Description class="space-y-6 text-gray-300">
              <p>
                <strong class="text-white block mb-1">Aperture</strong>
                Controls the opening in a lens. A lower f-number means a wider opening, more light, and a shallow depth of field (blurry background). A higher f-number means less light and more depth of field.
              </p>
              <p>
                <strong class="text-white block mb-1">Shutter Speed</strong>
                How long your camera's sensor is exposed to light. Fast shutter speeds (1/1000) freeze motion. Slower speeds (1/10) blur movement.
              </p>
              <p>
                <strong class="text-white block mb-1">ISO</strong>
                Your camera's sensitivity to light. Lower values (100) are clean. Higher values (1600) help in low light but add digital noise.
              </p>
            </Dialog.Description>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
}

export default HelpPanel;
