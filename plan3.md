Plan:
1.  **State Management (Zustand)**
    *   Add `history` (undo/redo stack) to `useWorkflowStore`.
        *   `past`: Array of `{ nodes, edges }` snapshots.
        *   `future`: Array of `{ nodes, edges }` snapshots.
        *   `pushHistory(nodes, edges)`: helper to push current state before making a change.
        *   `undo()` / `redo()` actions.
        *   Call `pushHistory` inside `addNode`, `addConnection`, `deleteSelected`, `updateNode`, `onNodesChange` (when drag ends/position changes, but for simplicity we can snapshot on significant actions like drag end, but we need to intercept `onNodesChange` carefully, or just add a general `commitChange` that the UI calls on drop). Wait, for `onNodesChange`, React Flow triggers many updates. We should capture history on `onNodeDragStop`.
    *   `deleteSelected` needs to delete all nodes where `node.selected === true` and all edges where `edge.selected === true` or connected to deleted nodes. Currently it only deletes `selectedNodeId` or `selectedEdgeId`.
    *   Add `ui.artifactPanelOpen` (boolean).
    *   Add `toggleArtifactPanel()`.
2.  **App & Layout**
    *   Update `Toolbar`:
        *   Add `Undo` (disabled if `past.length === 0`).
        *   Add `Redo` (disabled if `future.length === 0`).
        *   Add `Delete selected` (disabled if no selected node/edge).
        *   Change `Export` button to toggle `Artifact` panel instead of opening a modal.
    *   Convert `ArtifactModal` to `ArtifactPanel` (render similar to `Palette` or `SavedPanel`, maybe on the right or bottom. Let's see the layout: "At 768 pixels ... the Artifact panel stacks below the canvas when open" and "[2.5] layout composes as left palette, central canvas, collapsible Saved Workflows panel, toolbar ..., timeline panel below"). If it's a panel, where does it live in desktop? Probably a collapsible right panel next to Saved Workflows, or replacing it, or sharing the space. Actually, the instruction says "left palette, central canvas, collapsible Saved Workflows panel, toolbar ..., timeline". It doesn't specify Artifact panel position on desktop, but implies it might be a drawer or right panel. Let's make it a right panel (next to Saved Workflows) or overlay. Or maybe it opens from the bottom? Let's render it as a sliding side panel next to Saved Workflows, or replace Saved Workflows if both are open? Let's just make it a standard side panel.
3.  **Artifact Panel Content**
    *   If `nodes.length === 0`: show "Empty canvas. Drag nodes from the palette to build a workflow."
    *   Tabs for JSON / Mermaid.
    *   Download / Copy actions.
4.  **Coachmark**
    *   Add a simple popup/tooltip on load pointing to Palette, Run, and Artifact. e.g. "Tip: Drag nodes from the palette, click Run, or Export Artifacts".
5.  **Accessibility & Error Messages**
    *   Ensure all Modals have `aria-label`, `role="dialog"`, `aria-modal="true"`.
    *   Ensure all Form fields have `id` and `htmlFor` on label (Carbon does this if `id` is provided).
    *   Update empty canvas Run message: "There is nothing to run. Drag nodes from the palette onto the canvas to begin."
6.  **Multi-select**
    *   Use React Flow's built-in multi-selection.
    *   Update `useWorkflowStore` to handle `nodes` and `edges` selection via React Flow's `onNodesChange` and `onEdgesChange` instead of custom single-select state. Wait, the store uses `selectedNodeId`, we need to change it to check `node.selected` and `edge.selected`.
7.  **Status Badges**
    *   Check Carbon `<Tag>` colors.
    *   pending: gray (`cool-gray` or `gray`)
    *   running: blue (`blue`)
    *   retrying: amber (`warm-gray` or `magenta`? Carbon has `magenta`, `purple`, `cyan`, `teal`, `green`, `gray`, `cool-gray`, `warm-gray`, `high-contrast`, `outline`, `red`). Amber in Carbon is usually not a standard tag, wait. "amber" might map to a custom style, or `yellow`? Let's check Carbon tag colors. Usually `cyan` or `high-contrast`. Wait, the prompt says "pending gray, running blue, retrying amber, failed red, complete green". I'll use custom CSS for retrying if no amber exists, or use `warm-gray` and style it amber. Currently it uses `warm-gray`. I'll style `.status-retrying` with amber.
