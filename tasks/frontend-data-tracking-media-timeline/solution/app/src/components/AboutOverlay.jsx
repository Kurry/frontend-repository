import { createSignal } from "solid-js";
import Modal from "./Modal";
import { state, closeAbout } from "../store";
import { IconX } from "@tabler/icons-solidjs";

export default function AboutOverlay() {
  const [closing, setClosing] = createSignal(false);
  function close() {
    if (closing()) return;
    setClosing(true);
    setTimeout(() => {
      closeAbout();
      setTimeout(() => setClosing(false), 200);
    }, 180);
  }
  return (
    <Modal open={state.aboutOpen} closing={closing()} onClose={close} label="About MediaTimeline and how to use it" contentClass="bg-paper rounded-2xl shadow-2xl w-full max-w-xl max-h-[86vh] overflow-auto thin-scroll border border-[color:var(--line)]">
      <div class="flex items-center justify-between px-5 pt-5">
        <h2 class="font-display text-2xl font-semibold tracking-tight">About &amp; how to use</h2>
        <button class="chrome-btn rounded-lg p-1.5 hover:bg-[color:var(--paper-deep)]" onClick={close} aria-label="Dismiss About and help">
          <IconX size={20} />
        </button>
      </div>
      <div class="px-5 pb-5 pt-3 space-y-4 text-sm leading-relaxed text-[color:var(--ink)]">
        <p>
          MediaTimeline is a local, in-memory explorer of the history of media and communication. Everything you create, filter, and export lives only in this
          browser tab for the current session; reloading returns the seeded corpus, the default year window, all categories enabled, and empty undo and redo stacks.
        </p>
        <div>
          <h3 class="font-display text-base font-semibold mb-1">Scrub/Explore mode</h3>
          <p>
            In Scrub/Explore mode the timeline stage is the focus: colored swimlanes carry event pins at their year positions, faint era bands wash the stage behind the
            axis, and a current-era label tracks the window midpoint. Drag the stage to pan the year window, scroll the wheel to zoom around the window midpoint, and
            hold Shift while scrolling (or use a horizontal scroll gesture) to translate the window. The dual-handle scrubber and the numeric from/to inputs set the same
            bounds, and Fit all returns to the full seeded span. Hover a pin for its title, place, and BCE/CE year; click a pin to open its detail, then step with the
            Previous/Next controls or the left and right arrow keys.
          </p>
        </div>
        <div>
          <h3 class="font-display text-base font-semibold mb-1">Library/Filter mode</h3>
          <p>
            In Library/Filter mode you search the corpus, toggle the ten closed categories, switch the year sort between Year ascending and Year descending, and create,
            edit, or delete your own events through validated forms that enforce the TimelineEvent contract. Select two or more of your rows to reveal the selection tray
            with Batch categorize and Batch delete; seeded read-only events can never be rewritten or removed by bulk actions.
          </p>
        </div>
        <div>
          <h3 class="font-display text-base font-semibold mb-1">Export, import, and shortcuts</h3>
          <p>
            Export timeline compiles Timeline JSON, Events CSV, and Window Markdown live from the current collection, window, and filters; Copy and Download emit exactly
            that preview. Import timeline accepts a previously exported Timeline JSON and restores the collection, window, and enabled categories, naming any offending
            field on a malformed document. Press Ctrl+Z (or Cmd+Z) to Undo and Ctrl+Shift+Z (or Cmd+Shift+Z) to Redo through your creates, edits, deletes, batch actions,
            and imports; Escape closes any open detail, drawer, or dialog and returns focus to the control that opened it.
          </p>
        </div>
      </div>
    </Modal>
  );
}
