1. **Fix Artifact Modal / Panel:**
   The failing criteria mentions: "[4.8] Opening the Artifact panel with an empty canvas shows an empty-state line naming how to add nodes from the palette (or disables Download with a visible message)".
   Wait, the criteria in the prompt: "[4.8] Opening the Artifact panel with an empty canvas shows an empty-state line naming how to add nodes from the palette (or disables Download with a visible message)" and "[7.3] At 768 pixels and below the palette collapses to a compact strip or toggle, the Artifact panel stacks below the canvas when open, and the timeline remains reachable" - wait, the Artifact feature is currently a Modal, but the instruction calls it a "panel" and says it "stacks below the canvas when open" at 768px.
   Ah, look at the criteria in the prompt carefully. Wait, [2.5] The layout composes as left palette, central canvas, collapsible Saved Workflows panel, toolbar with ... Save/Artifact/Delete. Wait, the Artifact button opens a panel? But `ArtifactModal` is a `<Modal>`.
   "the Artifact panel stacks below the canvas when open"
   Wait, the current `ArtifactModal` uses `<Modal>`. The prompt says "Artifact panel".
   Actually, the user flow says:
   "[2.8] At 1024 pixels the Saved Workflows panel collapses behind a toggle, at 768 pixels the palette collapses and Artifact stacks below the canvas when open"
   Let's check if there's any other mention of Artifact panel.
   "Artifact panel" is mentioned multiple times. It seems it shouldn't be a Modal but a Panel? But wait, the instruction says "Export workflow / Download workflow.json / Copy JSON emit the active canvas ... Both update after node/edge edits and Save without a reload."
   If I change `ArtifactModal` to an `ArtifactPanel` side/bottom panel instead of a Modal. Or maybe it's just a Modal that acts as a panel?

   Wait, let's look at the failing criteria again from the initial prompt:
   - [1.1] Every interactive control — palette entries, toolbar buttons including Undo, Redo, Artifact, Delete selected, Run/Pause/Resume/Retry/Save, node disclo
   - [1.2] Modal dialogs (configuration, save, confirmation, import) ... (Artifact is NOT listed as a modal here!)
   - [1.6] Panel titles (Palette, Saved Workflows, Timeline, Artifact) ... so Artifact is a panel!

   So Artifact should be a Panel (like Palette, Saved Workflows, Timeline), not a Modal.
   Wait, where should it appear? It should be toggled by the Artifact toolbar button.

   Let's fix the other things:
   - Undo/Redo/Delete selected are missing from the toolbar!
   "Undo, Redo, Artifact, Delete selected, Run/Pause/Resume/Retry/Save"
   The toolbar currently has: Run, Pause/Resume, Retry, Save, Export (which should be Artifact), Import.
   I need to add Undo, Redo, and Delete selected to the toolbar!
   And rename Export to Artifact? Or maybe the button is "Artifact"?

   - [1.5] Every configuration, save, and import field has an explicit associated label
   - [1.10] With prefers-reduced-motion set, all flows — run, undo, import, export — remain completable
   - [4.5] Modal dialogs expose role dialog with aria-modal true...
   - [4.8] Empty canvas Artifact panel empty-state.
   - [4.n8] Delete selected with two nodes multi-selected leaves both nodes on the canvas -> fix multi-select delete.
   - [6.8] Multi-select two nodes, Delete selected...
   - [11.1] Coachmark or first-run tip pointing at palette drag, Run, and Artifact export.
   - [11.4] Empty-canvas and incomplete-graph validity messaging clear next-step guidance.
   - [11.5] Power-user keyboard affordances (documented shortcuts for undo/redo, artifact toggle, or multi-select).

   Wait, Undo and Redo are not implemented!
   I need to implement Undo/Redo. This involves history stack for nodes and edges.
