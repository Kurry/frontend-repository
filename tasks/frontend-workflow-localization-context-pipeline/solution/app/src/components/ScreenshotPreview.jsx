import { createSignal } from "solid-js";
import { store } from "../store";

export default function ScreenshotPreview() {
  const [viewport, setViewport] = createSignal(1440);
  const target = () => store.targetRevisions[store.activeUnitId]?.[store.activeLocale];

  const textContent = () => target()?.draft?.text || "No preview available";

  return (
    <div class="border border-border rounded-lg bg-surface flex flex-col mt-4">
      <div class="border-b border-border p-4 flex justify-between items-center">
        <h3 class="font-semibold text-md">Responsive Fit Preview</h3>
        <div class="space-x-2">
          <button class={`px-2 py-1 rounded text-xs ${viewport() === 375 ? 'bg-primary text-white' : 'bg-gray-200'}`} onClick={() => setViewport(375)}>Mobile (375px)</button>
          <button class={`px-2 py-1 rounded text-xs ${viewport() === 768 ? 'bg-primary text-white' : 'bg-gray-200'}`} onClick={() => setViewport(768)}>Tablet (768px)</button>
          <button class={`px-2 py-1 rounded text-xs ${viewport() === 1440 ? 'bg-primary text-white' : 'bg-gray-200'}`} onClick={() => setViewport(1440)}>Desktop (1440px)</button>
        </div>
      </div>

      <div class="p-4 bg-gray-100 overflow-x-auto flex justify-center items-center min-h-[200px]">
         <div
           class="border-2 border-dashed border-gray-400 bg-white p-4 relative overflow-hidden flex items-center justify-center transition-all duration-300"
           style={{ width: `${viewport()}px`, "max-width": "100%", height: "150px" }}
         >
            <div class="text-center font-serif text-lg leading-relaxed truncate" title={textContent()}>
               {textContent()}
            </div>

            {/* Mock deterministic truncation/overflow indication */}
            {textContent().length > (viewport() / 10) && (
               <div class="absolute top-2 right-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded border border-red-200">
                  Visual Overflow Warning
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
